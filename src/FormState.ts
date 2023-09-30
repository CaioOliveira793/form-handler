export interface FormStateInput<T> {
	value: T;
}

export class FormState<T> {
	public constructor({ value }: FormStateInput<T>) {
		this.value = value;
	}

	/**
	 * Returns a mutable reference of the form value.
	 *
	 * @returns mutable form value
	 */
	public getValue(): T {
		return this.value;
	}

	public setValue(value: T): void {
		this.value = value;
	}

	protected value: T;
}
