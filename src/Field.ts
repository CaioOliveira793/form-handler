export interface FieldNode<T, E> {
	getValue(): T;
	setValue(value: T): void;

	getErrors(): Array<E>;
	isInvalid(): boolean;

	isDirty(): boolean;
	isModified(): boolean;
	isTouched(): boolean;
}

export interface GroupNode<S, K, V> {
	extractValue(formValue: S, field: K): V;
	patchValue(formValue: S, field: K, value: V): void;
}

export interface GroupComposer<T, K, V> {
	assemble(attributes: Array<[K, V]>): T;
	patch(group: T, key: K, value: V): void;
	extract(group: T, key: K): V;
}

export interface FieldState<T, E> {
	initial: T;
	error: Array<E>;
	touched: boolean;
	modified: boolean;
}

export function fieldState<T, E>(initial: T): FieldState<T, E> {
	return {
		initial,
		error: [],
		modified: false,
		touched: false,
	};
}

export type EqualFn<T = unknown> = (a: T, b: T) => boolean;

export function defaultEqualFn<T = unknown>(a: T, b: T): boolean {
	// @ts-ignore
	return a === b;
}
