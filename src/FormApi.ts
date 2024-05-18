import {
	NodeError,
	NodeKey,
	GroupComposer,
	NodeSubscriber,
	Node,
	NodeGroup,
	Option,
	TargetNode,
	EqualFn,
	NodeState,
	initialNodeState,
	NodeConsistency,
	NodeGroupNotification,
	NodeNotification,
} from '@/NodeType';
import { defaultEqualFn, distributeAppendErrors, distributeReplaceErrors } from '@/Helper';

/**
 * Form validation function
 */
export type ValidateFn<T, E extends NodeError = NodeError> = (data: T) => Promise<Array<E>>;

/**
 * Form validation rejection handler
 */
export type ValidateRejectionHandler = (error: unknown) => void;

/**
 * Form submit rejection handler
 */
export type SubmitRejectionHandler = (error: unknown) => void;

/**
 * Form submit function.
 *
 * @param data form data
 * @param formApi reference to a formApi instance
 */
export type SubmitFn<T, K extends NodeKey, V, E extends NodeError = NodeError> = (
	data: T,
	formApi: FormApi<T, K, V, E>
) => Promise<Array<E>> | Promise<void> | Array<E> | void;

/**
 * Form validation trigger event.
 */
export type ValidationTrigger = 'focus' | 'blur' | 'value';

/**
 * Form submission state
 *
 * ### validation_error
 *
 * The form submission finished with an error from the validation function.
 *
 * ### submit_error
 *
 * The form submission finished with an error from the submit function.
 *
 * ### success
 *
 * The form submission finished successfully.
 */
export type SubmissionState = 'validation_error' | 'submit_error' | 'success';

export interface FormApiInput<T, K extends NodeKey, V, E extends NodeError = NodeError> {
	composer: GroupComposer<T, K, V>;
	initial?: T;
	/**
	 * Validation trigger event.
	 *
	 * @default 'value'
	 */
	validationTrigger?: ValidationTrigger;
	submit?: SubmitFn<T, K, V, E>;
	validate?: ValidateFn<T, E>;
	validateRejection?: ValidateRejectionHandler;
	submitRejection?: SubmitRejectionHandler;
	equalFn?: EqualFn<T>;
	subscriber?: NodeSubscriber<T, E> | null;
}

function noopFn() {
	/* no-op */
}

function validateRejectionHandler(error: unknown) {
	console.error('form validation rejected:', error);
}

function submitRejectionHandler(error: unknown) {
	console.error('form submit rejected:', error);
}

async function validateFn() {
	return [];
}

export class FormApi<T, K extends NodeKey, V, E extends NodeError = NodeError>
	implements NodeGroup<T, K, V, E>
{
	public constructor({
		composer,
		initial = composer.default(),
		validationTrigger = 'value',
		submit = noopFn,
		validate = validateFn,
		validateRejection = validateRejectionHandler,
		submitRejection = submitRejectionHandler,
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FormApiInput<T, K, V, E>) {
		this.value = structuredClone(initial);
		this.nodes = new Map();
		this.composer = composer;
		this.state = initialNodeState(initial);
		this.validationTrigger = validationTrigger;
		this.submitFn = submit;
		this.validateFn = validate;
		this.validateRejection = validateRejection;
		this.submitRejection = submitRejection;
		this.equalFn = equalFn;
		this.subscriber = subscriber;
	}

	public readonly equalFn: EqualFn<T>;
	public readonly subscriber: NodeSubscriber<T, E> | null;
	public readonly composer: GroupComposer<T, K, V>;

	public async submitAsync(): Promise<SubmissionState> {
		try {
			const errors = await this.validateFn(this.value);
			if (errors.length !== 0) {
				this.setErrors(errors);
				return 'validation_error';
			}
		} catch (err: unknown) {
			this.validateRejection(err);
			return 'validation_error';
		}

		try {
			const errors = await this.submitFn(this.value, this);
			if (errors && errors.length !== 0) {
				this.setErrors(errors);
				return 'submit_error';
			}
		} catch (err: unknown) {
			this.submitRejection(err);
			return 'submit_error';
		}

		return 'success';
	}

	public submit(): void {
		this.submitAsync();
	}

	public getState(): NodeState<T, E> {
		return this.state;
	}

	public replaceState(state: NodeState<T, E>): void {
		this.state = state;
	}

	public replaceGroup() {}

	public attachNode(key: K, node: Node<V, E>, consistency: NodeConsistency = 'full'): string {
		this.nodes.set(key, node);
		const path = this.makeNodepath(key);

		if (consistency === 'none' || !this.value) return path;

		const initialForm = this.composer.extract(this.value, key);
		const initialNode = node.getInitialValue();
		const initial = initialNode === undefined ? initialForm : initialNode;

		this.state.modified = true;
		this.composer.patch(this.value, key, initial as V);

		if (consistency === 'state') return path;

		this.subscriber?.({ type: 'value', value: this.value });

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}

		return path;
	}

	public detachNode(key: K, consistency: NodeConsistency = 'full'): boolean {
		const deleted = this.nodes.delete(key);

		if (consistency === 'none') return deleted;

		if (this.value) {
			this.state.modified = true;
			this.composer.delete(this.value, key);

			if (consistency === 'state') return deleted;

			this.subscriber?.({ type: 'value', value: this.value });

			if (this.validationTrigger === 'value') {
				this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
			}
		}

		return deleted;
	}

	public getNode(key: K): Option<Node<V, E>> {
		return this.nodes.get(key);
	}

	public makeNodepath(key: K): string {
		return key.toString();
	}

	public iterateNodes(): IterableIterator<Node<V, E>> {
		return this.nodes.values();
	}

	public iterateFields(): IterableIterator<K> {
		return this.nodes.keys();
	}

	public iterateEntries(): IterableIterator<[K, Node<V, E>]> {
		return this.nodes.entries();
	}

	public extractValue(key: K): Option<V> {
		return this.composer.extract(this.value, key);
	}

	public patchValue(key: K, value: V): Option<T> {
		this.state.modified = true;
		this.composer.patch(this.value, key, value);
		return this.value;
	}

	public handleFocusWithin(): void {
		this.state.touched = true;

		if (this.validationTrigger === 'focus') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public handleBlurWithin(): void {
		this.state.touched = true;

		if (this.validationTrigger === 'blur') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public getInitialValue(): Option<T> {
		return this.state.initial;
	}

	public getValue(): Option<T> {
		return this.value;
	}

	public setValue(value: T): void {
		this.state.modified = true;
		this.value = value;

		this.subscriber?.({ type: 'value', value: this.value });

		for (const [key, node] of this.nodes.entries()) {
			const data = this.composer.extract(this.value, key);
			node.notify({ type: 'parent-node-updated', value: data });
		}

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public resetValue(): void {
		this.setValue(structuredClone(this.state.initial as T));
	}

	public getErrors(target: TargetNode = 'current'): Array<E> {
		if (target === 'current') {
			return this.state.errors;
		}

		const errors: Array<E> = [];
		for (const node of this.nodes.values()) {
			errors.push(...node.getErrors('group'));
		}
		errors.push(...this.state.errors);

		return errors;
	}

	public setErrors(errors: Array<E>): void {
		this.errors = errors;
		const ownErrors = errors.filter(err => err.path === '.');
		this.state.errors = ownErrors;
		this.subscriber?.({ type: 'error', errors: ownErrors });
		distributeReplaceErrors(errors, this.nodes);
	}

	public appendErrors(errors: Array<E>): void {
		for (const error of errors) {
			if (error.path === this.path()) {
				this.state.errors.push(error);
			}
		}
		this.subscriber?.({ type: 'error', errors: this.state.errors });
		distributeAppendErrors(errors, this.nodes);
	}

	public clearErrors(target: TargetNode = 'current'): void {
		this.state.errors = [];
		this.subscriber?.({ type: 'error', errors: this.state.errors });

		if (target === 'current') return;
		for (const node of this.nodes.values()) {
			node.clearErrors('group');
		}
	}

	public path(): string {
		return '.';
	}

	public handleFocus(): void {
		this.state.active = true;
		this.state.touched = true;

		if (this.validationTrigger === 'focus') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public handleBlur(): void {
		this.state.active = false;
		this.state.touched = true;

		if (this.validationTrigger === 'blur') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public isValid(target: TargetNode = 'current'): boolean {
		if (target === 'current') {
			return this.state.errors.length === 0;
		}

		if (this.state.errors.length !== 0) return false;

		for (const node of this.nodes.values()) {
			if (!node.isValid('group')) return false;
		}

		return true;
	}

	public isDirty(): boolean {
		return !this.equalFn(this.state.initial, this.value);
	}

	public isActive(): boolean {
		return this.state.active;
	}

	public isModified(): boolean {
		return this.state.modified;
	}

	public isTouched(): boolean {
		return this.state.touched;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public notify(_: NodeNotification<T>): void {}

	public notifyGroup(notification: NodeGroupNotification): void {
		switch (notification.type) {
			case 'child-node-updated': {
				this.state.modified = true;
				this.subscriber?.({ type: 'value', value: this.value });

				if (this.validationTrigger === 'value') {
					this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
				}
				break;
			}
		}
	}

	private handleValidateFn = (errors: Array<E>): void => {
		// no errors returned and no errors present (nothing changed)
		if (errors.length === 0 && this.state.errors.length === 0) {
			return;
		}
		this.setErrors(errors);
	};

	private value: T;
	private errors: Array<E>;
	private readonly nodes: Map<K, Node<V, E>>;
	private state: NodeState<T, E>;
	private readonly validationTrigger: ValidationTrigger;

	private readonly submitFn: SubmitFn<T, K, V, E>;
	private readonly validateFn: ValidateFn<T, E>;
	private readonly validateRejection: ValidateRejectionHandler;
	private readonly submitRejection: SubmitRejectionHandler;
}
