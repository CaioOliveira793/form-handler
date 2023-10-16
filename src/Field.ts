export type FieldKey = string | number;

export interface FieldError {
	/** Structure path for the value of this error */
	path: string;
}

export type Option<T> = T | undefined;

export interface NodeParentValueUpdatedNotification<T> {
	type: 'parent-value-updated';
	data: Option<T>;
}

export interface NodeNestedValueUpdatedNotification {
	type: 'nested-value-updated';
}

export type NodeNotification<T> =
	| NodeParentValueUpdatedNotification<T>
	| NodeNestedValueUpdatedNotification;

export interface NodeValueEvent<T> {
	type: 'value';
	data: Option<T>;
}

export interface NodeErrorEvent<E extends FieldError> {
	type: 'error';
	errors: Array<E>;
}

export type NodeEvent<T, E extends FieldError> = NodeValueEvent<T> | NodeErrorEvent<E>;

/**
 * FieldNode event listener.
 */
export type NodeListener<T, E extends FieldError> = (event: NodeEvent<T, E>) => void;

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
	 * @returns list of errors
	 */
	getErrors(): Array<E>;
	/**
	 * Set the errors of this field.
	 *
	 * **triggers event**: 'error'
	 *
	 * @param errors new errors
	 */
	setErrors(errors: Array<E>): void;
	/**
	 * Append new errors in this field.
	 *
	 * **triggers event**: 'error'
	 *
	 * @param errors new errors
	 */
	appendErrors(errors: Array<E>): void;
	/**
	 * Handle all errors for this node returned from the form validation.
	 *
	 * @param errors error list produced from the validation
	 */
	handleValidation(errors: Array<E>): void;
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
	 * Notify the node of a event to be published.
	 *
	 * @param event - event
	 */
	notify(notification: NodeNotification<T>): void;
	/**
	 * Destructs the node and detaches itself from the parent.
	 */
	dispose(): void;
}

// function signalValueUpdate(nearestNode: 'up' | 'down') {}

/**
 * Node attachment
 */
export interface NodeAttachment {
	/**
	 * Notify for the parent node that its value was updated.
	 */
	notifyUpdate(): void;
	/**
	 * Remove a child node from the group.
	 */
	detach(): void;
	/**
	 * Path of field names from the root node to the attached node.
	 */
	path: string;
}

export type GroupNodeSubscriber<T> = (data: Option<T>) => void;

export interface GroupNode<T, K extends FieldKey, V, E extends FieldError> extends FieldNode<T, E> {
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
	listNode(): Array<[K, FieldNode<V, E>]>;
	getNode(field: K): FieldNode<V, E> | null;

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
	 * Returns if the nested nodes has some error.
	 *
	 * @returns if the nested nodes has some error
	 */
	hasNestedError(): boolean;
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
