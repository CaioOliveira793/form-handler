import {
	EqualFn,
	FieldError,
	NodeEventType,
	FieldKey,
	FieldNode,
	GroupNode,
	NodeListener,
	defaultEqualFn,
	Option,
} from '@/Field';

export interface FieldControlInput<F extends FieldKey, T, P, E extends FieldError> {
	field: F;
	parent: GroupNode<P, F, T, E>;
	initial?: T;
	equalFn?: EqualFn<T>;
	subscriber?: NodeListener<T, E> | null;
}

export class FieldControl<F extends FieldKey, T, P, E extends FieldError>
	implements FieldNode<T, E>
{
	public constructor({
		field,
		initial,
		parent,
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldControlInput<F, T, P, E>) {
		this.field = field;
		this.parent = parent;
		this.initial = initial;
		this.touched = false;
		this.modified = false;
		this.equalFn = equalFn;
		this.subscriber = subscriber;

		this.parent.attachNode(this.field, this);
	}

	public getInitialValue(): Option<T> {
		return this.initial;
	}

	public getValue(): Option<T> {
		return this.parent.extractValue(this.field);
	}

	public setValue(value: T): void {
		this.parent.patchValue(this.field, value);

		// publish value event
		this.subscriber?.({ type: 'value', data: value });
		this.parent.notify('value');
	}

	public getErrors(): Array<E> {
		return this.parent.extractErrors(this.field);
	}

	public appendErrors(errors: Array<E>): void {
		this.parent.appendErrors(errors);

		// publish error event
		this.subscriber?.({ type: 'error', errors: this.getErrors() });
	}

	public path(): string {
		return this.parent.path() + '.' + this.field;
	}

	public isDirty(): boolean {
		const value = this.getValue();
		if (!value) return true;
		return !this.equalFn(this.initial, value);
	}

	public isValid(): boolean {
		return this.parent.extractErrors(this.field).length === 0;
	}

	public isModified(): boolean {
		return this.modified;
	}

	public isTouched(): boolean {
		return this.touched;
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

	public dispose(): void {
		this.subscriber?.({ type: 'dispose' });
		this.parent.detachNode(this.field);
	}

	// [Symbol.dispose](): void {
	// 	this.dispose();
	// }

	private readonly field: F;
	private readonly parent: GroupNode<P, F, T, E>;
	private readonly initial: Option<T>;
	private touched: boolean;
	private modified: boolean;

	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeListener<T, E> | null;
}
