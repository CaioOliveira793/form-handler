import { EqualFn, FieldNode, FieldState, GroupNode, defaultEqualFn, fieldState } from '@/Field';
import { FormState } from '@/FormState';

export interface FieldControlInput<S, F, T> {
	form: FormState<S>;
	field: F;
	initial: T;
	parent: GroupNode<S, F, T>;
	equalFn?: EqualFn<T>;
}

export class FieldControl<S, F, T, E> implements FieldNode<T, E> {
	public constructor({
		form,
		field,
		initial,
		parent,
		equalFn = defaultEqualFn,
	}: FieldControlInput<S, F, T>) {
		this.form = form;
		this.field = field;
		this.parent = parent;
		this.state = fieldState(initial);
		this.equalFn = equalFn;

		this.parent.patchValue(this.form.getValue(), this.field, initial);
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
		return !this.equalFn(this.state.initial, this.getValue());
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
	protected readonly equalFn: EqualFn<T>;
}
