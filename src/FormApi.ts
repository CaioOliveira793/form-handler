import {
	NodeError,
	NodeKey,
	GroupComposer,
	NodeSubscriber,
	FieldNode,
	GroupNode,
	Option,
	NodeNotification,
	NodeTarget,
} from '@/NodeType';
import { EqualFn, defaultEqualFn, distributeErrors } from '@/Helper';

/**
 * Form validation function
 */
export type ValidateFn<T, E extends NodeError> = (data: T) => Promise<Array<E>>;

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
export type SubmitFn<T, K extends NodeKey, V, E extends NodeError> = (
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

export interface FormApiInput<T, K extends NodeKey, V, E extends NodeError> {
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

export class FormApi<T, K extends NodeKey, V, E extends NodeError>
	implements GroupNode<T, K, V, E>
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
		this.errors = [];
		this.nodes = new Map();
		this.composer = composer;
		this.initial = initial;
		this.touched = false;
		this.active = false;
		this.modified = false;
		this.validationTrigger = validationTrigger;
		this.submitFn = submit;
		this.validateFn = validate;
		this.validateRejection = validateRejection;
		this.submitRejection = submitRejection;
		this.equalFn = equalFn;
		this.subscriber = subscriber;
	}

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

	public attachNode(field: K, node: FieldNode<V, E>): string {
		this.nodes.set(field, node);
		const path = field.toString();

		if (!this.value) return path;

		const initialForm = this.composer.extract(this.value, field);
		const initialNode = node.getInitialValue();
		const initial = initialNode === undefined ? initialForm : initialNode;

		this.modified = true;
		this.composer.patch(this.value, field, initial as V);
		this.subscriber?.({ type: 'value', value: this.value });

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}

		return path;
	}

	public detachNode(field: K): boolean {
		const deleted = this.nodes.delete(field);

		if (this.value) {
			this.modified = true;
			this.composer.delete(this.value, field);
			this.subscriber?.({ type: 'value', value: this.value });

			if (this.validationTrigger === 'value') {
				this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
			}
		}

		return deleted;
	}

	public getNode(field: K): Option<FieldNode<V, E>> {
		return this.nodes.get(field);
	}

	public iterateNodes(): IterableIterator<FieldNode<V, E>> {
		return this.nodes.values();
	}

	public iterateFields(): IterableIterator<K> {
		return this.nodes.keys();
	}

	public iterateEntries(): IterableIterator<[K, FieldNode<V, E>]> {
		return this.nodes.entries();
	}

	public extractValue(field: K): Option<V> {
		return this.composer.extract(this.value, field);
	}

	public patchValue(field: K, value: V): Option<T> {
		this.modified = true;
		this.composer.patch(this.value, field, value);
		return this.value;
	}

	public handleFocusWithin(): void {
		this.touched = true;

		if (this.validationTrigger === 'focus') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public handleBlurWithin(): void {
		this.touched = true;

		if (this.validationTrigger === 'blur') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public getInitialValue(): Option<T> {
		return this.initial;
	}

	public getValue(): Option<T> {
		return this.value;
	}

	public setValue(value: T): void {
		this.modified = true;
		this.value = value;

		for (const [field, node] of this.nodes.entries()) {
			const data = this.composer.extract(this.value, field);
			node.notify({ type: 'parent-node-updated', value: data });
		}

		this.subscriber?.({ type: 'value', value: this.value });

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public reset(): void {
		this.setValue(structuredClone(this.initial));
	}

	public getErrors(target: NodeTarget = 'current'): Array<E> {
		if (target === 'current') {
			return this.errors;
		}

		const errors: Array<E> = [];
		for (const node of this.nodes.values()) {
			errors.push(...node.getErrors('group'));
		}
		errors.push(...this.errors);

		return errors;
	}

	public setErrors(errors: Array<E>): void {
		this.errors = errors.filter(err => err.path === '.');
		this.subscriber?.({ type: 'error', errors: this.errors });
		distributeErrors(errors, this.nodes);
	}

	public clearErrors(target: NodeTarget = 'current'): void {
		this.errors = [];
		if (target === 'current') {
			this.subscriber?.({ type: 'error', errors: this.errors });
			return;
		}

		for (const node of this.nodes.values()) {
			node.clearErrors('group');
		}

		this.subscriber?.({ type: 'error', errors: this.errors });
	}

	public path(): string {
		return '.';
	}

	public handleFocus(): void {
		this.active = true;
		this.touched = true;

		if (this.validationTrigger === 'focus') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public handleBlur(): void {
		this.active = false;
		this.touched = true;

		if (this.validationTrigger === 'blur') {
			this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
		}
	}

	public isValid(target: NodeTarget = 'current'): boolean {
		if (target === 'current') {
			return this.errors.length === 0;
		}

		if (this.errors.length !== 0) return false;

		for (const node of this.nodes.values()) {
			if (!node.isValid('group')) return false;
		}

		return true;
	}

	public isDirty(): boolean {
		return !this.equalFn(this.initial, this.value);
	}

	public isActive(): boolean {
		return this.active;
	}

	public isModified(): boolean {
		return this.modified;
	}

	public isTouched(): boolean {
		return this.touched;
	}

	public notify(notification: NodeNotification<T>): void {
		switch (notification.type) {
			case 'child-node-updated': {
				this.modified = true;
				this.subscriber?.({ type: 'value', value: this.value });

				if (this.validationTrigger === 'value') {
					this.validateFn(this.value).then(this.handleValidateFn).catch(this.validateRejection);
				}
				break;
			}

			case 'parent-node-updated':
				break;
		}
	}

	public dispose(): void {
		for (const node of this.nodes.values()) {
			node.dispose();
		}
	}

	private handleValidateFn = (errors: Array<E>): void => {
		// no errors returned and no errors present (nothing changed)
		if (errors.length === 0 && this.errors.length === 0) {
			return;
		}
		this.setErrors(errors);
	};

	private value: T;
	private readonly nodes: Map<K, FieldNode<V, E>>;
	private readonly composer: GroupComposer<T, K, V>;
	private readonly initial: T;
	private touched: boolean;
	private active: boolean;
	private modified: boolean;
	private errors: Array<E>;
	// private formErrors: Array<E>;
	private readonly validationTrigger: ValidationTrigger;

	private readonly submitFn: SubmitFn<T, K, V, E>;
	private readonly validateFn: ValidateFn<T, E>;
	private readonly validateRejection: ValidateRejectionHandler;
	private readonly submitRejection: SubmitRejectionHandler;
	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeSubscriber<T, E> | null;
}
