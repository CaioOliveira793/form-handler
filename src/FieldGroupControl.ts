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

export interface FieldGroupControlInput<
	F extends FieldKey,
	T,
	K extends FieldKey,
	V,
	P,
	E extends FieldError,
> {
	field: F;
	parent: GroupNode<P, F, T, E>;
	composer: GroupComposer<T, K, V>;
	initial?: T;
	equalFn?: EqualFn<T>;
	subscriber?: NodeListener<T, E> | null;
}

export class FieldGroupControl<
		F extends FieldKey,
		T,
		K extends FieldKey,
		V,
		P,
		E extends FieldError,
	>
	implements FieldNode<T, E>, GroupNode<T, K, V, E>
{
	public constructor({
		field,
		parent,
		composer,
		initial = composer.default(),
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldGroupControlInput<F, T, K, V, P, E>) {
		this.field = field;
		this.parent = parent;
		this.nodes = new Map();
		this.state = fieldState(initial);
		this.composer = composer;
		this.equalFn = equalFn;
		this.subscriber = subscriber;

		this.parent.attachNode(this.field, this);
		this.parent.patchValue(this.field, initial);
	}

	public attachNode(field: K, node: FieldNode<V, E>): void {
		this.nodes.set(field, node);

		const group = this.parent.extractValue(this.field);
		const value = node.getValue();
		if (!group || !value) return;

		this.composer.patch(group, field, value);
		this.subscriber?.({ type: 'value', data: group });
		this.parent.notify('value');
	}

	public detachNode(field: K): boolean {
		const deleted = this.nodes.delete(field);

		const group = this.parent.extractValue(this.field);
		if (group) {
			this.composer.delete(group, field);
			this.subscriber?.({ type: 'value', data: group });
			this.parent.notify('value');
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
		const group = this.parent.extractValue(this.field);
		if (!group) return;
		return this.composer.extract(group, field);
	}

	public patchValue(field: K, value: V): void {
		const group = this.parent.extractValue(this.field);
		if (!group) return;
		this.composer.patch(group, field, value);
	}

	public extractErrors(field: K): Array<E> {
		const fieldPath = this.path() + '.' + field;
		const errors = [];
		for (const err of this.parent.extractErrors(this.field)) {
			if (err.path.startsWith(fieldPath)) errors.push(err);
		}
		return errors;
	}

	public getValue(): Option<T> {
		return this.parent.extractValue(this.field);
	}

	public setValue(value: T): void {
		this.parent.patchValue(this.field, value);

		for (const node of this.nodes.values()) {
			node.notify('value');
		}

		// publish value event
		this.subscriber?.({ type: 'value', data: this.getValue() });
		this.parent.notify('value');
	}

	public getErrors(): Array<E> {
		return this.parent.extractErrors(this.field);
	}

	public appendErrors(errors: Array<E>): void {
		this.parent.appendErrors(errors);

		for (const node of this.nodes.values()) {
			node.notify('error');
		}

		// publish error event
		this.subscriber?.({ type: 'error', errors: this.getErrors() });
	}

	public path(): string {
		return this.parent.path() + '.' + this.field;
	}

	public isDirty(): boolean {
		const current = this.parent.extractValue(this.field);
		if (!current) return true;
		return !this.equalFn(current, this.state.initial);
	}

	public isInvalid(): boolean {
		return this.parent.extractErrors(this.field).length !== 0;
	}

	public isModified(): boolean {
		return this.state.modified;
	}

	public isTouched(): boolean {
		return this.state.touched;
	}

	public notify(type: NodeEventType): void {
		switch (type) {
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

	protected readonly field: F;
	protected readonly state: FieldState<T>;
	protected readonly parent: GroupNode<P, F, T, E>;
	protected readonly nodes: Map<K, FieldNode<V, E>>;
	protected readonly composer: GroupComposer<T, K, V>;
	protected readonly equalFn: EqualFn<T>;
	protected readonly subscriber: NodeListener<T, E> | null;
}
