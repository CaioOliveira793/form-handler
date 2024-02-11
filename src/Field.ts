import {
	NodeError,
	NodeKey,
	FieldNode,
	GroupNode,
	NodeSubscriber,
	Option,
	NodeNotification,
	NodeTarget,
} from '@/NodeType';
import { EqualFn, defaultEqualFn } from '@/Helper';

export interface FieldInput<F extends NodeKey, T, P, E extends NodeError> {
	field: F;
	parent: GroupNode<P, F, T, E>;
	initial?: T;
	equalFn?: EqualFn<T>;
	subscriber?: NodeSubscriber<T, E> | null;
}

export class Field<F extends NodeKey, T, P, E extends NodeError> implements FieldNode<T, E> {
	public constructor({
		field,
		initial,
		parent,
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldInput<F, T, P, E>) {
		this.field = field;
		this.parent = parent;
		this.initial = initial;
		this.touched = false;
		this.active = false;
		this.modified = false;
		this.errors = [];
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

		this.subscriber?.({ type: 'value', value });
		this.parent.notify({ type: 'child-node-updated' });
	}

	public reset(): void {
		this.setValue(structuredClone(this.initial) as T);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getErrors(_: NodeTarget = 'current'): Array<E> {
		return this.errors;
	}

	public setErrors(errors: Array<E>): void {
		this.errors = errors.filter(error => error.path === this.path());
		this.subscriber?.({ type: 'error', errors: this.errors });
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public clearErrors(_: NodeTarget = 'current'): void {
		this.errors = [];
		this.subscriber?.({ type: 'error', errors: this.errors });
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public isValid(_: NodeTarget = 'current'): boolean {
		return this.errors.length === 0;
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

	public notify(notification: NodeNotification<T>): void {
		switch (notification.type) {
			case 'child-node-updated':
				break;

			case 'parent-node-updated':
				this.modified = true;
				this.subscriber?.({ type: 'value', value: notification.value });
				break;
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
	private errors: Array<E>;

	private readonly equalFn: EqualFn<T>;
	private readonly subscriber: NodeSubscriber<T, E> | null;
}
