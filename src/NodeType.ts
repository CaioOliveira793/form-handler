/**
 * Equality comparison function.
 */
export type EqualFn<in T = unknown> = (a: T | undefined, b: T | undefined) => boolean;

export type NodeKey = string | number;

export interface NodeError {
	/**
	 * Structure path for the value of this error
	 */
	path: string;
}

/**
 * Target Node
 *
 * The target node that will be interacted.
 */
export type TargetNode = 'current' | 'group';

/**
 * Node update consistency
 *
 * Specify how consistent a node update will be.
 *
 * - `none`: Only the *main operation* will be executed. But the **node internal
 * state will not be updated**.
 * - `state`: *Main operation* will be executed and the internal state will be updated,
 * but **the subscriber will not run** and the **other nodes will not be notified**.
 * - `full`: *Main operation* will be executed, the internal state will be updated,
 * the node subscriber will run and the other nodes will be notified.
 */
export type NodeConsistency = 'none' | 'state' | 'full';

export type Option<T> = T | undefined;

export type NodeNotification<T> = ParentNodeUpdated<T>;

export interface ParentNodeUpdated<T> {
	type: 'parent-node-updated';
	value: Option<T>;
}

export type NodeGroupNotification = ChildNodeUpdated;

export interface ChildNodeUpdated {
	type: 'child-node-updated';
}

export type NodeEvent<T, E extends NodeError = NodeError> = NodeValueEvent<T> | NodeErrorEvent<E>;

export interface NodeValueEvent<T> {
	type: 'value';
	value: Option<T>;
}

export interface NodeErrorEvent<E extends NodeError = NodeError> {
	type: 'error';
	errors: Array<E>;
}

/**
 * Node event listener.
 */
export type NodeSubscriber<T, E extends NodeError = NodeError> = (event: NodeEvent<T, E>) => void;

/**
 * Node internal state.
 */
export interface NodeState<T, E> {
	readonly initial: Option<T>;
	touched: boolean;
	active: boolean;
	modified: boolean;
	// TODO: remove errors from the state
	errors: Array<E>;
}

export interface Node<T, E extends NodeError = NodeError> {
	/**
	 * Equality function used by the node value.
	 */
	readonly equalFn: EqualFn<T>;
	/**
	 * A subscriber function that receives node events.
	 */
	readonly subscriber: NodeSubscriber<T, E> | null;

	/**
	 * Return the current node state.
	 *
	 * @returns node state
	 */
	getState(): NodeState<T, E>;
	/**
	 * Replace the current state with the provided node state.
	 *
	 * @param state node state
	 */
	replaceState(state: NodeState<T, E>): void;
	/**
	 * Detach the current group from this node and
	 * attach a new group into this node.
	 *
	 * ### Consistency
	 *
	 * TODO: document the consistency options
	 *
	 * @param group internal node group
	 * @param key group key
	 * @param consistency operation consistency
	 */
	replaceGroup<K extends NodeKey>(
		group: InnerNodeGroup<K, T, E>,
		key: K,
		consistency?: NodeConsistency
	): void;
	/**
	 * Return the initial value of this node.
	 *
	 * @returns node initial value
	 */
	getInitialValue(): Option<T>;
	/**
	 * Return the value of this node.
	 *
	 * @returns node value
	 */
	getValue(): Option<T>;
	/**
	 * Replace the value of this node.
	 *
	 * **triggers event**: 'value'
	 *
	 * @param value replacing value
	 */
	setValue(value: T): void;
	/**
	 * Replace this node value with its initial value.
	 *
	 * **triggers event**: 'value'
	 */
	resetValue(): void;
	/**
	 * Return all the errors from this node
	 *
	 * @param {TargetNode} [target='current'] - error extraction target
	 * @returns list of errors
	 */
	getErrors(target?: TargetNode): Array<E>;
	/**
	 * Set the errors of the node.
	 *
	 * **triggers event**: 'error'
	 *
	 * @param errors new errors
	 */
	setErrors(errors: Array<E>): void;
	/**
	 * Append errors in the node.
	 *
	 * **triggers event**: 'error'
	 *
	 * @param errors new errors
	 */
	appendErrors(errors: Array<E>): void;
	/**
	 * Clear all the errors in the node target.
	 *
	 * @param {TargetNode} [target='current'] - target node
	 */
	clearErrors(target?: TargetNode): void;
	/**
	 * Node key path.
	 *
	 * @returns key path from the root form node to this node
	 */
	path(): string;
	/**
	 * Field focus event handler.
	 */
	handleFocus(): void;
	/**
	 * Field blur event handler.
	 */
	handleBlur(): void;
	/**
	 * Returns if the node does not have any error.
	 *
	 * @param {TargetNode} [target='current'] - target node
	 * @returns if the node does not have any error
	 */
	isValid(target?: TargetNode): boolean;
	/**
	 * Returns if the node value is different from the initial.
	 *
	 * @returns if the node value is different from the initial
	 */
	isDirty(): boolean;
	/**
	 * Returns if the node is currently focused (active).
	 *
	 * @returns if the node is currently focused.
	 */
	isActive(): boolean;
	/**
	 * Returns if the node value has been modified.
	 *
	 * @returns if the node has been modified
	 */
	isModified(): boolean;
	/**
	 * Returns if the node has been focused.
	 *
	 * @returns if the node has been focused
	 */
	isTouched(): boolean;

	/**
	 * Notify the node of a internal update.
	 *
	 * **triggers event**: 'value'
	 *
	 * @param notification - node notification
	 */
	notify(notification: NodeNotification<T>): void;
}

export interface NodeGroup<T, K extends NodeKey, V, E extends NodeError = NodeError>
	extends InnerNodeGroup<K, V, E>,
		Node<T, E> {
	readonly composer: GroupComposer<T, K, V>;
}

/**
 * Group node used internally by other nodes.
 */
export interface InnerNodeGroup<K extends NodeKey, in out V, E extends NodeError = NodeError> {
	/**
	 * Attach a node into the group.
	 *
	 * **triggers event**: 'value'
	 *
	 * ### Consistency
	 *
	 * TODO: document the consistency options
	 *
	 * @param key group key
	 * @param node child node
	 * @returns a path of node keys from the root node to the child node.
	 */
	attachNode(key: K, node: Node<V, E>, consistency?: NodeConsistency): string;
	/**
	 * Remove a node from the group.
	 *
	 * **triggers event**: 'value'
	 *
	 * ### Consistency
	 *
	 * TODO: document the consistency options
	 *
	 * @param key group key
	 * @returns true if the node was removed
	 */
	detachNode(key: K, consistency?: NodeConsistency): boolean;
	/**
	 * Returns a node in the group.
	 *
	 * @param key group key
	 * @returns optional node
	 */
	getNode(key: K): Option<Node<V, E>>;
	/**
	 * Generate the node path with the provided key.
	 *
	 * @param key group key
	 * @returns a path of node keys from the root node to the child node.
	 */
	makeNodepath(key: K): string;

	/**
	 * Returns a iterator of nodes attached in this group.
	 *
	 * @returns iterator of nodes
	 */
	iterateNodes(): IterableIterator<Node<V, E>>;
	/**
	 * Returns a iterator of entries (key and nodes) attached in this group.
	 *
	 * @returns iterator of key and node entries
	 */
	iterateEntries(): IterableIterator<[K, Node<V, E>]>;
	/**
	 * Returns a iterator of keys of nodes attached in this group.
	 *
	 * @returns iterator of keys
	 */
	iterateFields(): IterableIterator<K>;

	/**
	 * Returns a child node value in the group.
	 *
	 * @param key group key
	 * @returns optional child node value
	 */
	extractValue(key: K): Option<V>;
	/**
	 * Modifies the child node value in the node group.
	 *
	 * @param key group key
	 * @param value node value
	 */
	patchValue(key: K, value: V): void;

	/**
	 * Node focus within event handler.
	 *
	 * Handle focus events caused by child nodes within this group.
	 */
	handleFocusWithin(): void;
	/**
	 * Node blur within event handler.
	 *
	 * Handle blur events caused by child nodes within this group.
	 */
	handleBlurWithin(): void;

	/**
	 * Notify the node of a internal update.
	 *
	 * **triggers event**: 'value'
	 *
	 * @param notification - node update notification
	 */
	notifyGroup(notification: NodeGroupNotification): void;
}

/*
group | node -> detached (group | node)

export interface DetachToken<N extends Node<T, E>, T, E extends NodeError = NodeError>  {
	attachGroup<V, K extends NodeKey>(group: NodeGroup<V, K, T, E>, key: K): N;
}

removeGroup(): Detach<Self> {}

const detached = removeGroup();
const normalNode = detached.attachGroup(group, 'valueB');
*/

export interface GroupComposer<T, K extends NodeKey, V> {
	default(): T;
	patch(group: T, key: K, value: V): void;
	delete(group: T, key: K): void;
	extract(group: T, key: K): Option<V>;
}

/**
 * Initialize the node state with the default values.
 *
 * @param initial initial value of the node state
 * @returns initialized node state
 */
export function initialNodeState<T, E>(initial: Option<T>): NodeState<T, E> {
	return {
		initial,
		touched: false,
		active: false,
		modified: false,
		errors: [],
	};
}
