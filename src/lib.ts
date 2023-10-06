import {
	EqualFn,
	FieldError,
	NodeEventType,
	FieldKey,
	FieldNode,
	FieldState,
	GroupComposer,
	GroupNode,
	NodeListener,
	defaultEqualFn,
	fieldState,
	Option,
} from '@/Field';

export type ValidateFormValue<T, E extends FieldError> = (data: T) => Promise<Array<E>>;

export interface FormApiInput<T, K extends FieldKey, V, E extends FieldError> {
	composer: GroupComposer<T, K, V>;
	initial?: T;
	validate?: ValidateFormValue<T, E> | null;
	equalFn?: EqualFn<T>;
	subscriber?: NodeListener<T, E> | null;
}

export class FormApi<T, K extends FieldKey, V, E extends FieldError>
	implements FieldNode<T, E>, GroupNode<T, K, V, E>
{
	public constructor({
		composer,
		initial = composer.default(),
		validate = null,
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FormApiInput<T, K, V, E>) {
		this.value = initial;
		this.errors = [];
		this.nodes = new Map();
		this.state = fieldState(initial);
		this.composer = composer;
		this.validate = validate;
		this.equalFn = equalFn;
		this.subscriber = subscriber;
	}

	public attachNode(field: K, node: FieldNode<V, E>): void {
		this.nodes.set(field, node);
	}

	public detachNode(field: K): boolean {
		return this.nodes.delete(field);
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
		return !this.equalFn(this.value, this.state.initial);
	}

	public isInvalid(): boolean {
		return this.errors.length !== 0;
	}

	public isModified(): boolean {
		return this.state.modified;
	}

	public isTouched(): boolean {
		return this.state.touched;
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

	protected value: T;
	protected errors: Array<E>;
	protected readonly state: FieldState<T>;
	protected readonly nodes: Map<K, FieldNode<V, E>>;
	protected readonly composer: GroupComposer<T, K, V>;
	protected readonly validate: ValidateFormValue<T, E> | null;
	protected readonly equalFn: EqualFn<T>;
	protected readonly subscriber: NodeListener<T, E> | null;
}

export * from '@/Field';
export * from '@/FieldControl';
export * from '@/FieldGroupControl';
export * from '@/GroupComposer';
