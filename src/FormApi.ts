import {
	FieldError,
	FieldKey,
	GroupComposer,
	EqualFn,
	NodeListener,
	FieldNode,
	GroupNode,
	defaultEqualFn,
	Option,
	NodeNotification,
} from '@/Field';
import { distributeErrors } from '@/Helper';

/**
 * Form validation function
 */
export type ValidateFormFn<T, E extends FieldError> = (data: T) => Promise<Array<E>>;

/**
 * Form validation rejection handler
 */
export type ValidateFormRejectionHandler = (error: unknown) => void;

/**
 * Form submit function.
 *
 * @param data form data
 * @param formApi reference to a formApi instance
 */
export type SubmitFormFn<T, K extends FieldKey, V, E extends FieldError> = (
	data: T,
	formApi: FormApi<T, K, V, E>
) => Promise<Array<E>> | Promise<void> | Array<E> | void;

/**
 * Form validation trigger event.
 */
export type ValidationTrigger = 'focus' | 'blur' | 'value';

export interface FormApiInput<T, K extends FieldKey, V, E extends FieldError> {
	composer: GroupComposer<T, K, V>;
	initial?: T;
	/**
	 * Validation trigger event.
	 *
	 * @default 'value'
	 */
	validationTrigger?: ValidationTrigger;
	submit?: SubmitFormFn<T, K, V, E>;
	validate?: ValidateFormFn<T, E>;
	validateRejection?: ValidateFormRejectionHandler;
	equalFn?: EqualFn<T>;
	subscriber?: NodeListener<T, E> | null;
}

function noopFn() {
	/* no-op */
}

function validateRejectionHandler(error: unknown) {
	console.error('form validation rejected:', error);
}

async function validateFn() {
	return [];
}

export class FormApi<T, K extends FieldKey, V, E extends FieldError>
	implements FieldNode<T, E>, GroupNode<T, K, V, E>
{
	public constructor({
		composer,
		initial = composer.default(),
		validationTrigger = 'value',
		submit = noopFn,
		validate = validateFn,
		validateRejection = validateRejectionHandler,
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FormApiInput<T, K, V, E>) {
		this.value = initial;
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
		this.equalFn = equalFn;
		this.subscriber = subscriber;
	}

	public async submit(): Promise<void> {
		this.errors = await this.validateFn(this.value);

		if (this.errors.length !== 0) {
			this.subscriber?.({ type: 'error', errors: this.errors });
			return;
		}

		const errors = await this.submitFn(this.value, this);
		if (!errors || errors.length === 0) return;

		this.errors = errors;
		this.subscriber?.({ type: 'error', errors: this.errors });
	}

	public attachNode(field: K, node: FieldNode<V, E>): string {
		this.nodes.set(field, node);
		const path = field.toString();

		const value = node.getInitialValue();
		if (!this.value) return path;

		this.modified = true;
		this.composer.patch(this.value, field, value as V);
		this.subscriber?.({ type: 'value', data: this.value });

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
		}

		return path;
	}

	public detachNode(field: K): boolean {
		const deleted = this.nodes.delete(field);

		if (this.value) {
			this.modified = true;
			this.composer.delete(this.value, field);
			this.subscriber?.({ type: 'value', data: this.value });

			if (this.validationTrigger === 'value') {
				this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
			}
		}

		return deleted;
	}

	public listNode(): Array<[K, FieldNode<V, E>]> {
		return Array.from(this.nodes.entries());
	}

	public getNode(field: K): FieldNode<V, E> | null {
		return this.nodes.get(field) ?? null;
	}

	public extractValue(field: K): Option<V> {
		return this.composer.extract(this.value, field);
	}

	public patchValue(field: K, value: V): Option<T> {
		this.modified = true;
		this.composer.patch(this.value, field, value);
		return this.value;
	}

	public hasNestedError(): boolean {
		for (const node of this.nodes.values()) {
			if (node.isValid()) return true;
		}
		return false;
	}

	public handleFocusWithin(): void {
		this.touched = true;

		if (this.validationTrigger === 'focus') {
			this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
		}
	}

	public handleBlurWithin(): void {
		this.touched = true;

		if (this.validationTrigger === 'blur') {
			this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
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
			node.notify({ type: 'parent-value-updated', data });
		}

		this.subscriber?.({ type: 'value', data: this.value });

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
		}
	}

	public reset(): void {
		this.setValue(this.initial);
	}

	public getErrors(): Array<E> {
		return this.errors;
	}

	public setErrors(errors: Array<E>): void {
		this.errors = errors;

		this.subscriber?.({ type: 'error', errors: this.errors });
	}

	public appendErrors(errors: Array<E>): void {
		this.errors.push(...errors);

		this.subscriber?.({ type: 'error', errors: this.errors });
	}

	public handleValidation(errors: Array<E>): void {
		this.errors = errors;

		this.subscriber?.({ type: 'error', errors: this.errors });

		distributeErrors(this.errors, this.nodes);
	}

	public path(): string {
		return '.';
	}

	public handleFocus(): void {
		this.active = true;
		this.touched = true;
	}

	public handleBlur(): void {
		this.active = false;
		this.touched = true;
	}

	public isValid(): boolean {
		return this.errors.length === 0;
	}

	public isFormValid(): boolean {
		return !this.hasNestedError();
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
			case 'nested-value-updated': {
				this.modified = true;
				this.subscriber?.({ type: 'value', data: this.value });

				if (this.validationTrigger === 'value') {
					this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
				}
				break;
			}

			case 'parent-value-updated':
				break;
		}
	}

	public dispose(): void {
		for (const node of this.nodes.values()) {
			node.dispose();
		}
	}

	private handleError = (errors: Array<E>): void => {
		// no errors returned and no errors present (nothing changed)
		if (errors.length === 0 && this.errors.length === 0) return;

		this.errors = errors;
		this.subscriber?.({ type: 'error', errors });

		distributeErrors(this.errors, this.nodes);
	};

	private value: T;
	private readonly nodes: Map<K, FieldNode<V, E>>;
	private readonly composer: GroupComposer<T, K, V>;
	private readonly initial: T;
	private touched: boolean;
	private active: boolean;
	private modified: boolean;
	private errors: Array<E>;
	private readonly validationTrigger: ValidationTrigger;

	private readonly submitFn: SubmitFormFn<T, K, V, E>;
	private readonly validateFn: ValidateFormFn<T, E>;
	private readonly validateRejection: ValidateFormRejectionHandler;
	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeListener<T, E> | null;
}
