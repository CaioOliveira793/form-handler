export type FieldKey = string | number;

export interface FieldError {
	/** Structure path for the value of this error */
	path: string;
}

export type Option<T> = T | undefined;

export type NodeEventType = 'value' | 'error' | 'active' | 'blur' | 'dispose';

export type FieldEvent<T, E extends FieldError> =
	| { type: 'value'; data: Option<T> }
	| { type: 'error'; errors: Array<E> }
	| { type: 'active' }
	| { type: 'blur' }
	| { type: 'dispose' };

/**
 * FieldNode event listener.
 */
export type NodeListener<T, E extends FieldError> = (event: FieldEvent<T, E>) => void;

export interface FieldNode<T, E extends FieldError> {
	/**
	 * Return the initial value for this node.
	 *
	 * @returns node initial value
	 */
	getInitialValue(): Option<T>;
	/**
	 * Return the value for this node.
	 *
	 * @returns node value
	 */
	getValue(): Option<T>;
	/**
	 * Replace this field node value.
	 *
	 * **triggers events**: 'value'
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
	 * **triggers events**: 'error'
	 *
	 * @param errors new errors
	 */
	appendErrors(errors: Array<E>): void;
	/**
	 * Node field path.
	 *
	 * @returns field path from the root form node to this node
	 */
	path(): string;

	isValid(): boolean;
	isDirty(): boolean;
	isModified(): boolean;
	isTouched(): boolean;

	notify(type: NodeEventType): void;
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
	 */
	attachNode(field: K, node: FieldNode<V, E>): void;
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
