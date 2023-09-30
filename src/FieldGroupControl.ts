import {
	EqualFn,
	FieldNode,
	FieldState,
	GroupComposer,
	GroupNode,
	defaultEqualFn,
	fieldState,
} from '@/Field';
import { FormState } from '@/FormState';

export interface FieldGroupControlInput<S, F, T, K, V> {
	form: FormState<S>;
	field: F;
	initial: T;
	parent: GroupNode<S, F, T>;
	composer: GroupComposer<T, K, V>;
	equalFn?: EqualFn<T>;
}

export class FieldGroupControl<S, F, T, K, V, E> implements FieldNode<T, E>, GroupNode<S, K, V> {
	public constructor({
		form,
		field,
		initial,
		parent,
		composer,
		equalFn = defaultEqualFn,
	}: FieldGroupControlInput<S, F, T, K, V>) {
		this.form = form;
		this.field = field;
		this.parent = parent;
		this.state = fieldState(initial);
		this.composer = composer;
		this.equalFn = equalFn;

		this.parent.patchValue(this.form.getValue(), this.field, initial);
	}

	public extractValue(formValue: S, field: K): V {
		const group = this.parent.extractValue(formValue, this.field);
		return this.composer.extract(group, field);
	}

	public patchValue(formValue: S, field: K, value: V): void {
		const group = this.parent.extractValue(formValue, this.field);
		this.composer.patch(group, field, value);
	}

	public getValue(): T {
		return this.parent.extractValue(this.form.getValue(), this.field);
	}

	public setValue(value: T): void {
		this.parent.patchValue(this.form.getValue(), this.field, value);
	}

	public getErrors(): Array<E> {
		return this.state.error;
	}

	public isDirty(): boolean {
		const current = this.parent.extractValue(this.form.getValue(), this.field);
		return !this.equalFn(current, this.state.initial);
	}

	public isInvalid(): boolean {
		return this.state.error.length !== 0;
	}

	public isModified(): boolean {
		return this.state.modified;
	}

	public isTouched(): boolean {
		return this.state.touched;
	}

	protected readonly form: FormState<S>;
	protected readonly field: F;
	protected readonly state: FieldState<T, E>;
	protected readonly parent: GroupNode<S, F, T>;
	protected readonly composer: GroupComposer<T, K, V>;
	protected readonly equalFn: EqualFn<T>;
}

export function composeNodeAttributes<K, V, E>(nodes: Array<[K, FieldNode<V, E>]>): Array<[K, V]> {
	const attributes: Array<[K, V]> = [];
	for (const [key, node] of nodes) {
		attributes.push([key, node.getValue()]);
	}
	return attributes;
}
