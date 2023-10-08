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
} from '@/Field';

export type ValidateFormFn<T, E extends FieldError> = (
	data: T
) => Promise<Array<E>> | Promise<void> | Array<E> | void;

export type SubmitFormFn<T, K extends FieldKey, V, E extends FieldError> = (
	data: T,
	formApi: FormApi<T, K, V, E>
) => Promise<Array<E>> | Promise<void> | Array<E> | void;

export interface FormApiInput<T, K extends FieldKey, V, E extends FieldError> {
	composer: GroupComposer<T, K, V>;
	initial?: T;
	submit: SubmitFormFn<T, K, V, E>;
	validate?: ValidateFormFn<T, E>;
	equalFn?: EqualFn<T>;
	subscriber?: NodeListener<T, E> | null;
}

function defaultValidateFn() {
	/* no-op */
}

export class FormApi<T, K extends FieldKey, V, E extends FieldError>
	implements FieldNode<T, E>, GroupNode<T, K, V, E>
{
	public constructor({
		composer,
		initial = composer.default(),
		submit,
		validate = defaultValidateFn,
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FormApiInput<T, K, V, E>) {
		this.value = initial;
		this.errors = [];
		this.nodes = new Map();
		this.composer = composer;
		this.initial = initial;
		this.touched = false;
		this.modified = false;
		this.submitFn = submit;
		this.validateFn = validate;
		this.equalFn = equalFn;
		this.subscriber = subscriber;
	}

	public async submit(): Promise<void> {
		// TODO: add form validation trigger event.
		this.errors = (await this.validateFn(this.value)) ?? [];

		if (this.errors.length === 0) {
			this.subscriber?.({ type: 'error', errors: this.errors });
			return;
		}

		const errors = await this.submitFn(this.value, this);
		if (!errors) return;

		this.errors = errors;
		this.subscriber?.({ type: 'error', errors: this.errors });
	}

	public attachNode(field: K, node: FieldNode<V, E>): void {
		this.nodes.set(field, node);

		const value = node.getInitialValue();
		if (!this.value) return;

		this.composer.patch(this.value, field, value as V);
		this.subscriber?.({ type: 'value', data: this.value });
	}

	public detachNode(field: K): boolean {
		const deleted = this.nodes.delete(field);

		if (this.value) {
			this.composer.delete(this.value, field);
			this.subscriber?.({ type: 'value', data: this.value });
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

	public getInitialValue(): Option<T> {
		return this.initial;
	}

	public getValue(): T {
		return this.value;
	}

	public setValue(value: T): void {
		this.value = value;

		for (const node of this.nodes.values()) {
			node.notify('value');
		}

		this.subscriber?.({ type: 'value', data: this.getValue() });
	}

	public getErrors(): Array<E> {
		return this.errors;
	}

	public appendErrors(errors: Array<E>): void {
		this.errors.push(...errors);

		for (const node of this.nodes.values()) {
			node.notify('error');
		}

		this.subscriber?.({ type: 'error', errors: this.getErrors() });
	}

	public path(): string {
		return '';
	}

	public isDirty(): boolean {
		return !this.equalFn(this.value, this.initial);
	}

	public isValid(): boolean {
		return this.errors.length === 0;
	}

	public isModified(): boolean {
		return this.modified;
	}

	public isTouched(): boolean {
		return this.touched;
	}

	public notify(kind: NodeEventType): void {
		switch (kind) {
			case 'value':
				this.subscriber?.({ type: 'value', data: this.getValue() });
				return;
			case 'error':
				this.subscriber?.({ type: 'error', errors: this.getErrors() });
				return;
			case 'active':
				this.subscriber?.({ type: 'active' });
				return;
			case 'blur':
				this.subscriber?.({ type: 'blur' });
				return;
		}
	}

	public dispose(): void {
		this.subscriber?.({ type: 'dispose' });
	}

	private value: T;
	private errors: Array<E>;
	private readonly nodes: Map<K, FieldNode<V, E>>;
	private readonly composer: GroupComposer<T, K, V>;
	private readonly initial: Option<T>;
	private touched: boolean;
	private modified: boolean;

	private readonly submitFn: SubmitFormFn<T, K, V, E>;
	private readonly validateFn: ValidateFormFn<T, E>;
	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeListener<T, E> | null;
}
