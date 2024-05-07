import {
	NodeError,
	NodeKey,
	Node,
	GroupComposer,
	NodeGroup,
	NodeSubscriber,
	Option,
	TargetNode,
	EqualFn,
	InnerNodeGroup,
	NodeState,
	initialNodeState,
	NodeConsistency,
	NodeGroupNotification,
	NodeNotification,
} from '@/NodeType';
import { defaultEqualFn, distributeAppendErrors, distributeReplaceErrors } from '@/Helper';

export interface FieldGroupInput<in out T, K extends NodeKey, V, E extends NodeError = NodeError> {
	key: NodeKey;
	parent: InnerNodeGroup<NodeKey, T, E>;
	composer: GroupComposer<T, K, V>;
	state?: NodeState<T, E>;
	equalFn?: EqualFn<T>;
	subscriber?: NodeSubscriber<T, E> | null;
}

export interface FieldGroupInitialInput<
	in out T,
	K extends NodeKey,
	V,
	E extends NodeError = NodeError,
> {
	key: NodeKey;
	parent: InnerNodeGroup<NodeKey, T, E>;
	composer: GroupComposer<T, K, V>;
	initial?: T;
	equalFn?: EqualFn<T>;
	subscriber?: NodeSubscriber<T, E> | null;
}

export class FieldGroup<T, K extends NodeKey, V, E extends NodeError = NodeError>
	implements NodeGroup<T, K, V, E>
{
	public constructor({
		parent,
		key,
		composer,
		state = initialNodeState(composer.default()),
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldGroupInput<T, K, V, E>) {
		this.key = key;
		this.parent = parent;
		this.nodes = new Map();
		this.composer = composer;
		this.state = state;
		this.equalFn = equalFn;
		this.subscriber = subscriber;

		this.nodepath = this.parent.attachNode(this.key, this);
	}

	public static init<T, K extends NodeKey, V, E extends NodeError = NodeError>({
		key,
		parent,
		composer,
		initial = composer.default(),
		equalFn = defaultEqualFn,
		subscriber = null,
	}: FieldGroupInitialInput<T, K, V, E>): FieldGroup<T, K, V, E> {
		return new FieldGroup({
			parent,
			key,
			composer,
			state: initialNodeState(initial),
			equalFn,
			subscriber,
		});
	}

	public readonly equalFn: EqualFn<T>;
	public readonly subscriber: NodeSubscriber<T, E> | null;
	public readonly composer: GroupComposer<T, K, V>;

	public getState(): NodeState<T, E> {
		return this.state;
	}

	public replaceState(state: NodeState<T, E>) {
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

	public attachNode(key: K, node: Node<V, E>, consistency: NodeConsistency = 'full'): string {
		this.nodes.set(key, node);
		const path = this.makeNodepath(key);

		if (consistency === 'none') return path;

		const group = this.parent.extractValue(this.key);
		if (!group) return path;

		const initialGroup = this.composer.extract(group, key);
		const initialNode = node.getInitialValue();
		const initial = initialNode === undefined ? initialGroup : initialNode;

		this.state.modified = true;
		this.composer.patch(group, key, initial as V);

		if (consistency === 'state') return path;

		this.subscriber?.({ type: 'value', value: group });
		this.parent.notifyGroup({ type: 'child-node-updated' });

		return path;
	}

	public detachNode(key: K, consistency: NodeConsistency = 'full'): boolean {
		const deleted = this.nodes.delete(key);

		if (consistency === 'none') return deleted;

		const group = this.parent.extractValue(this.key);
		if (group) {
			this.state.modified = true;
			this.composer.delete(group, key);

			if (consistency === 'state') return deleted;

			this.subscriber?.({ type: 'value', value: group });
			this.parent.notifyGroup({ type: 'child-node-updated' });
		}
		return deleted;
	}

	public getNode(key: K): Option<Node<V, E>> {
		return this.nodes.get(key);
	}

	public makeNodepath(key: K): string {
		return this.nodepath + '.' + key;
	}

	public iterateNodes(): IterableIterator<Node<V, E>> {
		return this.nodes.values();
	}

	public iterateFields(): IterableIterator<K> {
		return this.nodes.keys();
	}

	public iterateEntries(): IterableIterator<[K, Node<V, E>]> {
		return this.nodes.entries();
	}

	public extractValue(key: K): Option<V> {
		const group = this.parent.extractValue(this.key);
		if (!group) return;
		return this.composer.extract(group, key);
	}

	public patchValue(key: K, value: V): Option<T> {
		const group = this.parent.extractValue(this.key);
		if (!group) return undefined;
		this.state.modified = true;
		this.composer.patch(group, key, value);
		return group;
	}

	public handleFocusWithin(): void {
		this.state.touched = true;

		this.parent.handleFocusWithin();
	}

	public handleBlurWithin(): void {
		this.state.touched = true;

		this.parent.handleBlurWithin();
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

		for (const [key, node] of this.nodes.entries()) {
			const data = this.composer.extract(value, key);
			node.notify({ type: 'parent-node-updated', value: data });
		}

		this.parent.notifyGroup({ type: 'child-node-updated' });
	}

	public resetValue(): void {
		this.setValue(structuredClone(this.state.initial as T));
	}

	public getErrors(target: TargetNode = 'current'): Array<E> {
		if (target === 'current') {
			return this.state.errors;
		}

		const errors: Array<E> = [];
		for (const node of this.nodes.values()) {
			errors.push(...node.getErrors('group'));
		}
		errors.push(...this.state.errors);

		return errors;
	}

	public setErrors(errors: Array<E>): void {
		this.state.errors = errors.filter(err => err.path === this.path());
		this.subscriber?.({ type: 'error', errors: this.state.errors });
		distributeReplaceErrors(errors, this.nodes);
	}

	public appendErrors(errors: Array<E>): void {
		for (const error of errors) {
			if (error.path === this.path()) {
				this.state.errors.push(error);
			}
		}
		this.subscriber?.({ type: 'error', errors: this.state.errors });
		distributeAppendErrors(errors, this.nodes);
	}

	public clearErrors(target: TargetNode = 'current'): void {
		this.state.errors = [];
		this.subscriber?.({ type: 'error', errors: this.state.errors });

		if (target === 'current') return;
		for (const node of this.nodes.values()) {
			node.clearErrors('group');
		}
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

	public isValid(target: TargetNode = 'current'): boolean {
		if (target === 'current') {
			return this.state.errors.length === 0;
		}

		if (this.state.errors.length !== 0) return false;

		for (const node of this.nodes.values()) {
			if (!node.isValid('group')) return false;
		}

		return true;
	}

	public isDirty(): boolean {
		return !this.equalFn(this.state.initial, this.parent.extractValue(this.key));
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

				if (!notification.value) {
					for (const node of this.nodes.values()) {
						node.notify({ type: 'parent-node-updated', value: undefined });
					}
					break;
				}

				for (const [key, node] of this.nodes.entries()) {
					const data = this.composer.extract(notification.value, key);
					node.notify({ type: 'parent-node-updated', value: data });
				}
				break;
		}
	}

	public notifyGroup(notification: NodeGroupNotification): void {
		switch (notification.type) {
			case 'child-node-updated':
				this.state.modified = true;
				this.subscriber?.({ type: 'value', value: this.getValue() });
				this.parent.notifyGroup({ type: 'child-node-updated' });
				break;
		}
	}

	private nodepath: string;
	private key: NodeKey;
	private parent: InnerNodeGroup<NodeKey, T, E>;
	private readonly nodes: Map<K, Node<V, E>>;
	private state: NodeState<T, E>;
}
