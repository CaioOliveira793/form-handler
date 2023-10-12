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
	EventBroadcast,
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
		this.active = false;
		this.modified = false;
		this.equalFn = equalFn;
		this.subscriber = subscriber;

		this.nodepath = this.parent.attachNode(this.field, this);
	}

	public getInitialValue(): Option<T> {
		return this.initial;
	}

	public getValue(): Option<T> {
		return this.parent.extractValue(this.field);
	}

	public setValue(value: T): void {
		this.modified = true;
		this.parent.patchValue(this.field, value);

		this.subscriber?.({ type: 'value', data: value });
		this.parent.notify('value', 'up');
	}

	public reset(): void {
		this.setValue(this.initial as T);
	}

	public getErrors(): Array<E> {
		return this.parent.extractErrors(this.field);
	}

	public appendErrors(errors: Array<E>): void {
		this.parent.appendErrors(errors);

		this.subscriber?.({ type: 'error', errors: this.getErrors() });
	}

	public path(): string {
		return this.nodepath;
	}

	public handleFocus(): void {
		this.active = true;
		this.touched = true;

		this.parent.handleFocusWithin();
	}

	public handleBlur(): void {
		this.active = false;
		this.touched = true;

		this.parent.handleBlurWithin();
	}

	public isValid(): boolean {
		return this.parent.extractErrors(this.field).length === 0;
	}

	public isDirty(): boolean {
		return !this.equalFn(this.initial, this.getValue());
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
			case 'value':
				this.modified = true;
				this.subscriber?.({ type: 'value', data: this.getValue() });
				break;
			case 'error':
				this.subscriber?.({ type: 'error', errors: this.getErrors() });
				break;
		}

		if (broadcast === 'up') {
			this.parent.notify(type, 'up');
		}
	}

	public dispose(): void {
		this.parent.detachNode(this.field);
	}

	private readonly nodepath: string;
	private readonly field: F;
	private readonly parent: GroupNode<P, F, T, E>;
	private readonly initial: Option<T>;
	private touched: boolean;
	private active: boolean;
	private modified: boolean;

	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeListener<T, E> | null;
}
