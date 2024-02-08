export type NodeKey = string | number;

export interface NodeError {
	/**
	 * Structure path for the value of this error
	 */
	path: string;
}

/**
 * Node target
 *
 * The target node that will be interacted.
 */
export type NodeTarget = 'current' | 'group';

export type Option<T> = T | undefined;

export interface ParentNodeUpdated<T> {
	type: 'parent-node-updated';
	value: Option<T>;
}

export interface ChildNodeUpdated {
	type: 'child-node-updated';
}

export interface ChildNodeError<E extends NodeError> {
	type: 'child-node-error';
	errors: Array<E>;
}

export type NodeNotification<T, E extends NodeError> =
	| ParentNodeUpdated<T>
	| ChildNodeUpdated
	| ChildNodeError<E>;

export interface NodeValueEvent<T> {
	type: 'value';
	value: Option<T>;
}

export interface NodeErrorEvent<E extends NodeError> {
	type: 'error';
	errors: Array<E>;
}

export type NodeEvent<T, E extends NodeError> = NodeValueEvent<T> | NodeErrorEvent<E>;

/**
 * Node event listener.
 */
export type NodeSubscriber<T, E extends NodeError> = (event: NodeEvent<T, E>) => void;

export interface FieldNode<T, E extends NodeError> {
	/**
	 * Return the initial value of this field.
	 *
	 * @returns node initial value
	 */
	getInitialValue(): Option<T>;
	/**
	 * Return the value of this field.
	 *
	 * @returns node value
	 */
	getValue(): Option<T>;
	/**
	 * Replace the value of this field.
	 *
	 * **triggers event**: 'value'
	 *
	 * @param value replacing value
	 */
	setValue(value: T): void;
	/**
	 * Resplace this field value with its initial value.
	 *
	 * **triggers event**: 'value'
	 */
	reset(): void;
	/**
	 * Return all the errors from this field
	 *
	 * @param {NodeTarget} [target='current'] - error extraction target
	 * @returns list of errors
	 */
	getErrors(target?: NodeTarget): Array<E>;
	/**
	 * Set the errors of this field.
	 *
	 * **triggers event**: 'error'
	 *
	 * @param errors new errors
	 */
	setErrors(errors: Array<E>): void;
	/**
	 * Clear all the errors in the node target.
	 *
	 * @param {NodeTarget} [target='current'] - target node
	 */
	clearErrors(target?: NodeTarget): void;
	/**
	 * Field node path.
	 *
	 * @returns field path from the root form node to this node
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
	 * Returns if the field does not have any error.
	 *
	 * @param {NodeTarget} [target='current'] - target node
	 * @returns if the field does not have any error
	 */
	isValid(target?: NodeTarget): boolean;
	/**
	 * Returns if the field value is different from the initial.
	 *
	 * @returns if the field value is different from the initial
	 */
	isDirty(): boolean;
	/**
	 * Returns if the field is currently focused (active).
	 *
	 * @returns if the field is currently focused.
	 */
	isActive(): boolean;
	/**
	 * Returns if the field value has been modified.
	 *
	 * @returns if the field has been modified
	 */
	isModified(): boolean;
	/**
	 * Returns if the field has been focused.
	 *
	 * @returns if the field has been focused
	 */
	isTouched(): boolean;
	/**
	 * Notify the node of a internal update.
	 *
	 * **triggers event**: 'value'
	 *
	 * @param notification - node update notification
	 */
	notify(notification: NodeNotification<T, E>): void;
	/**
	 * Destructs the node and detaches itself from the parent.
	 */
	dispose(): void;
}

export interface GroupNode<T, K extends NodeKey, V, E extends NodeError> extends FieldNode<T, E> {
	/**
	 * Attach a field node into the group.
	 *
	 * **triggers event**: 'value'
	 *
	 * @param field group field
	 * @param node child node
	 * @returns a path of field names from the root node to the child node.
	 */
	attachNode(field: K, node: FieldNode<V, E>): string;
	/**
	 * Remove a field node from the group.
	 *
	 * **triggers event**: 'value'
	 *
	 * @param field group field
	 * @returns true if the node was removed
	 */
	detachNode(field: K): boolean;
	/**
	 * Returns a node in the group.
	 *
	 * @param field group field
	 * @returns optional node
	 */
	getNode(field: K): Option<FieldNode<V, E>>;

	/**
	 * Returns a iterator of nodes attached in this group.
	 *
	 * @returns iterator of nodes
	 */
	iterateNodes(): IterableIterator<FieldNode<V, E>>;
	/**
	 * Returns a iterator of entries (fields and nodes) attached in this group.
	 *
	 * @returns iterator of field and node entries
	 */
	iterateEntries(): IterableIterator<[K, FieldNode<V, E>]>;
	/**
	 * Returns a iterator of fields of nodes attached in this group.
	 *
	 * @returns iterator of fields
	 */
	iterateFields(): IterableIterator<K>;

	/**
	 * Returns a field in the group.
	 *
	 * @param field group field
	 * @returns optional field value
	 */
	extractValue(field: K): Option<V>;
	/**
	 * Modifies the field in the node group.
	 *
	 * @param field group field
	 * @param value field value
	 * @returns node value
	 */
	patchValue(field: K, value: V): Option<T>;

	/**
	 * Field focus within event handler.
	 *
	 * Handle focus events caused by fields within this group.
	 */
	handleFocusWithin(): void;
	/**
	 * Field blur within event handler.
	 *
	 * Handle blur events caused by fields within this group.
	 */
	handleBlurWithin(): void;
}

export interface GroupComposer<T, K extends NodeKey, V> {
	default(): T;
	patch(group: T, key: K, value: V): void;
	delete(group: T, key: K): void;
	extract(group: T, key: K): Option<V>;
}
