import {
	NodeError,
	NodeKey,
	Node,
	NodeSubscriber,
	Option,
	TargetNode,
	EqualFn,
	InnerNodeGroup,
	initialNodeState,
	NodeState,
	NodeConsistency,
	NodeNotification,
} from '@/NodeType';
import { defaultEqualFn } from '@/Helper';

export interface FieldInput<in out T, E extends NodeError = NodeError> {
	key: NodeKey;
	parent: InnerNodeGroup<NodeKey, T, E>;
	initial?: T;
	equalFn?: EqualFn<T>;
	subscriber?: NodeSubscriber<T, E> | null;
}

export interface FieldInitialInput<in out T, E extends NodeError = NodeError> {
	key: NodeKey;
	parent: InnerNodeGroup<NodeKey, T, E>;
	state?: NodeState<T, E>;
	equalFn?: EqualFn<T>;
	subscriber?: NodeSubscriber<T, E> | null;
}

export class Field<T, E extends NodeError = NodeError> implements Node<T, E> {
	public constructor({
		parent,
		key,
		state = initialNodeState(undefined as Option<T>),
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldInitialInput<T, E>) {
		this.key = key;
		this.parent = parent;
		this.state = state;
		this.equalFn = equalFn;
		this.subscriber = subscriber;

		this.nodepath = this.parent.attachNode(this.key, this);
	}

	public static init<T, E extends NodeError = NodeError>({
		parent,
		key,
		initial,
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldInput<T, E>): Field<T, E> {
		return new Field({ parent, key, state: initialNodeState(initial), equalFn, subscriber });
	}

	public readonly equalFn: EqualFn<T>;
	public readonly subscriber: NodeSubscriber<T, E> | null;

	public getState(): NodeState<T, E> {
		return this.state;
	}

	public replaceState(state: NodeState<T, E>): void {
		this.state = state;
	}

	public replaceGroup<K extends NodeKey>(
		group: InnerNodeGroup<K, T, E>,
		key: K,
		consistency: NodeConsistency = 'full'
	) {
		this.parent.detachNode(this.key, consistency);

		this.parent = group;
		this.key = key;
		this.nodepath = this.parent.makeNodepath(key);
	}

	public getInitialValue(): Option<T> {
		return this.state.initial;
	}

	public getValue(): Option<T> {
		return this.parent.extractValue(this.key);
	}

	public setValue(value: T): void {
		this.state.modified = true;
		this.parent.patchValue(this.key, value);

		this.subscriber?.({ type: 'value', value });
		this.parent.notifyGroup({ type: 'child-node-updated' });
	}

	public resetValue(): void {
		this.setValue(structuredClone(this.state.initial) as T);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public getErrors(_: TargetNode = 'current'): Array<E> {
		return this.state.errors;
	}

	public setErrors(errors: Array<E>): void {
		this.state.errors = errors.filter(error => error.path === this.path());
		this.subscriber?.({ type: 'error', errors: this.state.errors });
	}

	public appendErrors(errors: Array<E>): void {
		for (const error of errors) {
			if (error.path === this.path()) {
				this.state.errors.push(error);
			}
		}
		this.subscriber?.({ type: 'error', errors: this.state.errors });
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public clearErrors(_: TargetNode = 'current'): void {
		this.state.errors = [];
		this.subscriber?.({ type: 'error', errors: this.state.errors });
	}

	public path(): string {
		return this.nodepath;
	}

	public handleFocus(): void {
		this.state.active = true;
		this.state.touched = true;

		this.parent.handleFocusWithin();
	}

	public handleBlur(): void {
		this.state.active = false;
		this.state.touched = true;

		this.parent.handleBlurWithin();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public isValid(_: TargetNode = 'current'): boolean {
		return this.state.errors.length === 0;
	}

	public isDirty(): boolean {
		return !this.equalFn(this.state.initial, this.getValue());
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

	public notify(notification: NodeNotification<T>): void {
		switch (notification.type) {
			case 'parent-node-updated':
				this.state.modified = true;
				this.subscriber?.({ type: 'value', value: notification.value });
				break;
		}
	}

	private nodepath: string;
	private key: NodeKey;
	private parent: InnerNodeGroup<NodeKey, T, E>;
	private state: NodeState<T, E>;
}
