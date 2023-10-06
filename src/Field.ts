export type FieldKey = string | number;

export interface FieldError {
	path: string;
}

export type NodeEventType = 'value' | 'error' | 'active' | 'blur';

export type FieldEvent<T, E extends FieldError> =
	| { type: NodeEventType; data: T }
	| { type: NodeEventType; errors: Array<E> }
	| { type: NodeEventType }
	| { type: NodeEventType };

export type NodeListener<T, E extends FieldError> = (event: FieldEvent<T, E>) => void;

export type Option<T> = T | undefined;

// TODO: document witch events are triggered in the FieldNode and FieldGroup interface.

export interface FieldNode<T, E extends FieldError> {
	/**
	 * Return the value for this node.
	 *
	 * @returns node value
	 */
	getValue(): Option<T>;
	/**
	 * Replace this field node value.
	 *
	 * **triggers event**
	 *
	 * @param value replacing value
	 */
	setValue(value: T): void;
	/**
	 * Return all the errors from this node
	 *
	 * @returns list of errors
	 */
	getErrors(): Array<E>;
	/**
	 * Append new errors for this field node.
	 *
	 * **triggers event**
	 *
	 * @param errors new errors
	 */
	appendErrors(errors: Array<E>): void;
	/**
	 * Node field path.
	 *
	 * @returns the field path from the root form api to this node
	 */
	path(): string;

	isInvalid(): boolean;
	isDirty(): boolean;
	isModified(): boolean;
	isTouched(): boolean;

	notify(type: NodeEventType): void;
}

export interface GroupNode<T, K extends FieldKey, V, E extends FieldError> extends FieldNode<T, E> {
	/**
	 * Attach a field node into the group.
	 *
	 * **triggers events**
	 *
	 * @param field group field
	 * @param node child node
	 */
	attachNode(field: K, node: FieldNode<V, E>): void;
	/**
	 * Remove a field node from the group.
	 *
	 * **triggers events**
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
}

export interface GroupComposer<T, K extends FieldKey, V> {
	default(): T;
	assemble(attributes: Array<[K, V]>): T;
	patch(group: T, key: K, value: V): void;
	delete(group: T, key: K): void;
	extract(group: T, key: K): Option<V>;
}

export interface FieldState<T> {
	initial: T;
	touched: boolean;
	modified: boolean;
}

export function fieldState<T>(initial: T): FieldState<T> {
	return {
		initial,
		modified: false,
		touched: false,
	};
}

export type EqualFn<T = unknown> = (a: T, b: T) => boolean;

export function defaultEqualFn<T = unknown>(a: T, b: T): boolean {
	// @ts-ignore
	return a === b;
}
