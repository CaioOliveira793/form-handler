export type FieldKey = string | number;

export interface FieldError {
	/** Structure path for the value of this error */
	path: string;
}

export type Option<T> = T | undefined;

export type NodeEventType = 'value' | 'error';

export type EventBroadcast = 'up' | 'down' | 'none';

export type FieldEvent<T, E extends FieldError> =
	| { type: 'value'; data: Option<T> }
	| { type: 'error'; errors: Array<E> };

/**
 * FieldNode event listener.
 */
export type NodeListener<T, E extends FieldError> = (event: FieldEvent<T, E>) => void;

// TODO: send the complete event in `FieldNode.notify` to avoid inefficiencies.

export interface FieldNode<T, E extends FieldError> {
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
	 * **triggers events**: 'value'
	 *
	 * @param value replacing value
	 */
	setValue(value: T): void;
	/**
	 * Resplace this field value with its initial value.
	 *
	 * **triggers events**: 'value'
	 */
	reset(): void;
	/**
	 * Return all the errors from this field
	 *
	 * @returns list of errors
	 */
	getErrors(): Array<E>;
	/**
	 * Append new errors for this field.
	 *
	 * **triggers events**: 'error'
	 *
	 * @param errors new errors
	 */
	appendErrors(errors: Array<E>): void;
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
	 * @returns if the field does not have any error
	 */
	isValid(): boolean;
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
	 * Notify the node of a event type to be published for itself and/or broadcasted for
	 * its parents (`up`) or childrens (`down`).
	 *
	 * Broadcast options:
	 *
	 * - `up`: all the node parents.
	 * - `down`: all the node childrens.
	 * - `none`: only itself.
	 *
	 * @param type - event type
	 * @param {'up' | 'down' | 'none'} [broadcast=none] - broadcast direction
	 */
	notify(type: NodeEventType, broadcast?: EventBroadcast): void;
	/**
	 * Destructs the node and detaches itself from the parent.
	 */
	dispose(): void;
}

export interface GroupNode<T, K extends FieldKey, V, E extends FieldError> extends FieldNode<T, E> {
	/**
	 * Attach a field node into the group.
	 *
	 * **triggers events**: 'value'
	 *
	 * @param field group field
	 * @param node child node
	 * @returns a path of field names from the root node to the child node.
	 */
	attachNode(field: K, node: FieldNode<V, E>): string;
	/**
	 * Remove a field node from the group.
	 *
	 * **triggers events**: 'value'
	 *
	 * @param field group field
	 * @returns true if the node was removed
	 */
	detachNode(field: K): boolean;
	listNode(): Array<[K, FieldNode<V, E>]>;
	getNode(field: K): FieldNode<V, E> | null;

	extractValue(field: K): Option<V>;
	patchValue(field: K, value: V): void;

	extractErrors(field: K): Array<E>;

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

export interface GroupComposer<T, K extends FieldKey, V> {
	default(): T;
	assemble(attributes: Array<[K, V]>): T;
	patch(group: T, key: K, value: V): void;
	delete(group: T, key: K): void;
	extract(group: T, key: K): Option<V>;
}

/**
 * Equality comparison function.
 */
export type EqualFn<T = unknown> = (a: T | undefined, b: T | undefined) => boolean;

/**
 * Default equality comparison.
 *
 * @param a
 * @param b
 * @returns strict equality comparison `a === b`
 */
export function defaultEqualFn<T = unknown>(a: T | undefined, b: T | undefined): boolean {
	return a === b;
}
