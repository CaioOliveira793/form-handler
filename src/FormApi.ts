import {
	FieldError,
	FieldKey,
	GroupComposer,
	EqualFn,
	NodeListener,
	FieldNode,
	GroupNode,
	defaultEqualFn,
	NodeEventType,
	Option,
	EventBroadcast,
} from '@/Field';

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

		const value = node.getInitialValue();
		if (!this.value) return field.toString();

		this.modified = true;
		this.composer.patch(this.value, field, value as V);
		this.subscriber?.({ type: 'value', data: this.value });

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
		}

		return field.toString();
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

	public patchValue(field: K, value: V): void {
		this.modified = true;
		this.composer.patch(this.value, field, value);
	}

	public extractErrors(field: K): E[] {
		const errors = [];
		for (const err of this.errors) {
			if (err.path.startsWith(field.toString())) {
				errors.push(err);
			}
		}
		return errors;
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

	public getValue(): T {
		return this.value;
	}

	public setValue(value: T): void {
		this.modified = true;
		this.value = value;

		for (const node of this.nodes.values()) {
			node.notify('value', 'down');
		}

		this.subscriber?.({ type: 'value', data: this.getValue() });

		if (this.validationTrigger === 'value') {
			this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
		}
	}

	public reset(): void {
		this.setValue(this.initial as T);
	}

	public getErrors(): Array<E> {
		return this.errors;
	}

	public appendErrors(errors: Array<E>): void {
		this.errors.push(...errors);

		for (const node of this.nodes.values()) {
			node.notify('error', 'down');
		}

		this.subscriber?.({ type: 'error', errors: this.getErrors() });
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

	public notify(type: NodeEventType, broadcast: EventBroadcast = 'none'): void {
		switch (type) {
			case 'value': {
				this.modified = true;
				this.subscriber?.({ type: 'value', data: this.getValue() });

				if (this.validationTrigger === 'value') {
					this.validateFn(this.value).then(this.handleError).catch(this.validateRejection);
				}
				break;
			}
			case 'error':
				this.subscriber?.({ type: 'error', errors: this.getErrors() });
				break;
		}

		if (broadcast === 'down') {
			for (const node of this.nodes.values()) {
				node.notify(type, 'down');
			}
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
		for (const node of this.nodes.values()) {
			node.notify('error', 'down');
		}
	};

	private value: T;
	private errors: Array<E>;
	private readonly nodes: Map<K, FieldNode<V, E>>;
	private readonly composer: GroupComposer<T, K, V>;
	private readonly initial: Option<T>;
	private touched: boolean;
	private active: boolean;
	private modified: boolean;
	private readonly validationTrigger: ValidationTrigger;

	private readonly submitFn: SubmitFormFn<T, K, V, E>;
	private readonly validateFn: ValidateFormFn<T, E>;
	private readonly validateRejection: ValidateFormRejectionHandler;
	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeListener<T, E> | null;
}
