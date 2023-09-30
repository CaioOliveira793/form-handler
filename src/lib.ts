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

export interface FormApiInput<T, K, V> {
	form: FormState<T>;
	initial: T;
	composer: GroupComposer<T, K, V>;
	equalFn?: EqualFn<T>;
}

export class FormApi<T, K, V, E> implements FieldNode<T, E>, GroupNode<T, K, V> {
	public constructor({ form, initial, composer, equalFn = defaultEqualFn }: FormApiInput<T, K, V>) {
		this.form = form;
		this.state = fieldState(initial);
		this.composer = composer;
		this.equalFn = equalFn;

		this.form.setValue(initial);
	}

	public extractValue(formValue: T, field: K): V {
		return this.composer.extract(formValue, field);
	}

	public patchValue(formValue: T, field: K, value: V): void {
		this.composer.patch(formValue, field, value);
	}

	public getValue(): T {
		return this.form.getValue();
	}

	public setValue(value: T): void {
		this.form.setValue(value);
	}

	public getErrors(): Array<E> {
		return this.state.error;
	}

	public isDirty(): boolean {
		return !this.equalFn(this.form.getValue(), this.state.initial);
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

	private readonly form: FormState<T>;
	private readonly state: FieldState<T, E>;
	private readonly composer: GroupComposer<T, K, V>;
	private readonly equalFn: EqualFn<T>;
}

export * from '@/Field';
export * from '@/FieldControl';
export * from '@/FieldGroupControl';
export * from '@/GroupComposer';
