import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/FormApi';
import { ObjectComposer, ObjectGroupComposer } from '@/GroupComposer';
import { Field } from '@/Field';
import { FieldGroup } from '@/FieldGroup';
import { NodeError, NodeEvent, NodeSubscriber } from '@/NodeType';

interface TestAddress {
	state: string;
	street: string;
}

interface TestFormData {
	name: string;
	email: string;
	address: TestAddress;
}

interface TestError extends NodeError {
	message: string;
}

function delay(time: number): Promise<void> {
	return new Promise(resolver => setTimeout(resolver, time));
}

function makeSubscriber<T, E extends NodeError>(
	history: Array<NodeEvent<T, E>>
): NodeSubscriber<T, E> {
	return function subscriber(event: NodeEvent<T, E>) {
		history.push(structuredClone(event));
	};
}

describe('Field state management', () => {
	it('change state on focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const field = new Field({ parent: form, field: 'name' });

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);

		field.handleFocus();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), true);
	});

	it('change state on focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const field = new Field({ parent: form, field: 'name' });

		field.handleFocus();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), true);

		field.handleBlur();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), false);
	});

	it('change parent state on field focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('change parent state on field focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);

		field.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('execute form validation on field focus event', () => {
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'focus',
			validate: async data => {
				validationHistory.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('Carlos Gomes');
		streetField.handleFocus();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
		]);

		stateField.setValue('Bahia');
		stateField.handleFocus();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
			{ address: { street: 'Carlos Gomes', state: 'Bahia' } },
		]);
	});

	it('change state on blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const field = new Field({ parent: form, field: 'name' });

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);

		field.handleBlur();

		assert.strictEqual(field.isTouched(), true);
		assert.strictEqual(field.isActive(), false);
	});

	it('change parent state on field blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('execute form validation on field blur event', () => {
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'blur',
			validate: async data => {
				validationHistory.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('Carlos Gomes');
		streetField.handleBlur();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
		]);

		stateField.setValue('Bahia');
		stateField.handleBlur();

		assert.deepStrictEqual(validationHistory, [
			{ address: { street: 'Carlos Gomes', state: undefined } },
			{ address: { street: 'Carlos Gomes', state: 'Bahia' } },
		]);
	});

	it('change modified state on field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);
	});

	it('keep state as modified after reseting the field value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);

		field.reset();

		assert.strictEqual(field.isTouched(), false);
		assert.strictEqual(field.isActive(), false);
		assert.strictEqual(field.isModified(), true);
	});

	it('change parent modified state on field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		field.setValue('Av. San');

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);

		assert.strictEqual(form.isTouched(), false);
		assert.strictEqual(form.isActive(), false);
		assert.strictEqual(form.isModified(), true);
	});

	it('change the field state to dirty after its value has been modified', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		field.setValue('Av. S');

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);
	});

	it('change the field state to not dirty when its value is equal to the initial', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street', initial: null });

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		field.setValue('Av. S');

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);

		field.setValue(null);

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), false);

		assert.deepStrictEqual(field.getInitialValue(), field.getValue());
	});

	it('change the field state to dirty after modifying the parent value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const field = new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(field.isModified(), false);
		assert.strictEqual(field.isDirty(), false);

		addressField.setValue({ state: 'Rio Grande do Sul', street: 'R' });

		assert.strictEqual(field.isModified(), true);
		assert.strictEqual(field.isDirty(), true);

		assert.notDeepStrictEqual(field.getInitialValue(), field.getValue());
		assert.deepStrictEqual(field.getValue(), 'R');
	});

	it('execute form validation on field change event', () => {
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'value',
			validate: async data => {
				validationHistory.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('L');

		assert.deepStrictEqual(validationHistory, [
			{ address: {} },
			{ address: { street: undefined } },
			{ address: { street: undefined, state: undefined } },
			{ address: { street: 'L', state: undefined } },
		]);

		stateField.setValue('R');

		assert.deepStrictEqual(validationHistory, [
			{ address: {} },
			{ address: { street: undefined } },
			{ address: { street: undefined, state: undefined } },
			{ address: { street: 'L', state: undefined } },
			{ address: { street: 'L', state: 'R' } },
		]);
	});

	it('change the field state to invalid when an error is present in the field', async () => {
		const validationHistory: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'value',
			validate: async data => {
				validationHistory.push(structuredClone(data));

				if (!data.address) return [];
				if (!data.address.street) return [];
				return [{ message: 'Invalid street name', path: 'address.street' }];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setValue('invalid');

		await delay(10);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(stateField.isValid(), true);
		assert.deepStrictEqual(stateField.getErrors(), []);
	});
});

describe('Field error manipulation', () => {
	it('append new errors in a field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.appendErrors([
			{ message: 'Test error', path: 'address.street' },
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(form.isFormValid(), false);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'Test error', path: 'address.street' },
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(stateField.isValid(), true);
		assert.deepStrictEqual(stateField.getErrors(), []);

		streetField.appendErrors([{ message: 'Another one', path: 'address.street' }]);

		assert.strictEqual(form.isFormValid(), false);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'Test error', path: 'address.street' },
			{ message: 'Invalid street name', path: 'address.street' },
			{ message: 'Another one', path: 'address.street' },
		]);
	});

	it('replace the errors of a field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		streetField.setErrors([
			{ message: 'error#1', path: 'address.street' },
			{ message: 'error#2', path: 'address.street' },
		]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'error#1', path: 'address.street' },
			{ message: 'error#2', path: 'address.street' },
		]);

		assert.strictEqual(form.isFormValid(), false);

		assert.strictEqual(stateField.isValid(), true);
		assert.deepStrictEqual(stateField.getErrors(), []);

		streetField.setErrors([{ message: 'error#0', path: 'address.street' }]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ message: 'error#0', path: 'address.street' },
		]);

		assert.strictEqual(form.isFormValid(), false);
	});
});

describe('Field value mutation', () => {
	it('start the field value to initial on attachment', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: 'test',
		});

		assert.deepStrictEqual(streetField.getInitialValue(), 'test');
		assert.deepStrictEqual(streetField.getValue(), 'test');

		assert.deepStrictEqual(addressField.getValue(), { street: 'test' });
	});

	it('set the field value mutating the parent node', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(addressField.getValue(), { street: null });
		assert.deepStrictEqual(streetField.getInitialValue(), null);

		streetField.setValue('another test');

		assert.deepStrictEqual(streetField.getInitialValue(), null);
		assert.deepStrictEqual(streetField.getValue(), 'another test');

		assert.deepStrictEqual(addressField.getValue(), { street: 'another test' });
	});

	it('reset the field value to initial', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		streetField.setValue('another test');

		assert.deepStrictEqual(streetField.getInitialValue(), null);
		assert.deepStrictEqual(streetField.getValue(), 'another test');

		streetField.reset();

		assert.deepStrictEqual(streetField.getValue(), null);
		assert.deepStrictEqual(addressField.getValue(), { street: null });
	});
});

describe('Field node composition', () => {
	it('dispose a field detaching itself from the form', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.equal(addressField.getNode('street'), streetField);

		streetField.dispose();

		assert.equal(addressField.getNode('street'), null);
	});

	it('have a path of fields form the root node', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.strictEqual(streetField.path(), 'address.street');
	});
});

describe('Field event subscription', () => {
	it('publish a value event after setting a new value in the field', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		streetField.setValue('first');
		assert.deepStrictEqual(history, [{ type: 'value', value: 'first' }]);

		streetField.setValue('on ty');
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'first' },
			{ type: 'value', value: 'on ty' },
		]);

		streetField.setValue('on typ');
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'first' },
			{ type: 'value', value: 'on ty' },
			{ type: 'value', value: 'on typ' },
		]);

		streetField.setValue('on type');
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'first' },
			{ type: 'value', value: 'on ty' },
			{ type: 'value', value: 'on typ' },
			{ type: 'value', value: 'on type' },
		]);
	});

	it('publish a value event after resetting the field', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		streetField.setValue('else');
		assert.deepStrictEqual(history, [{ type: 'value', value: 'else' }]);

		streetField.reset();
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'else' },
			{ type: 'value', value: null },
		]);

		streetField.reset();
		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'else' },
			{ type: 'value', value: null },
			{ type: 'value', value: null },
		]);
	});

	it('publish an error event after setting an error in the field', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		streetField.setErrors([{ path: 'address.street', message: '#1' }]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address.street', message: '#1' }] },
		]);

		streetField.setErrors([{ path: 'address.street', message: 'none' }]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address.street', message: '#1' }] },
			{ type: 'error', errors: [{ path: 'address.street', message: 'none' }] },
		]);
	});

	it('publish an error event after appending new errors in the field', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
			initial: null,
		});

		assert.deepStrictEqual(history, []);

		streetField.appendErrors([{ path: 'address.street', message: '#1' }]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address.street', message: '#1' }] },
		]);

		streetField.appendErrors([
			{ path: 'address.street', message: 'none' },
			{ path: 'address.street', message: 'some' },
		]);

		assert.deepStrictEqual(history, [
			{ type: 'error', errors: [{ path: 'address.street', message: '#1' }] },
			{
				type: 'error',
				errors: [
					{ path: 'address.street', message: '#1' },
					{ path: 'address.street', message: 'none' },
					{ path: 'address.street', message: 'some' },
				],
			},
		]);
	});

	it('publish an error event after executing the validation error handler', async () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validate: async (data: TestFormData) => {
				if (!data?.address) return [];
				if (!data.address.street) return [];
				return [{ path: 'address.street', message: 'the field is invalid' }];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
		});

		assert.deepStrictEqual(history, []);

		streetField.setValue('invalid');
		await delay(10);

		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'invalid' },
			{ type: 'error', errors: [{ path: 'address.street', message: 'the field is invalid' }] },
		]);
	});

	it('publish a value event after a parent node updated notification', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validate: async (data: TestFormData) => {
				if (!data?.address) return [];
				if (!data.address.street) return [];
				return [{ path: 'address.street', message: 'the field is invalid' }];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
		});

		assert.deepStrictEqual(history, []);

		addressField.setValue({ street: 'change', state: '' });

		assert.deepStrictEqual(history, [{ type: 'value', value: 'change' }]);

		streetField.notify({ node: 'parent', value: 'change again' });

		assert.deepStrictEqual(history, [
			{ type: 'value', value: 'change' },
			{ type: 'value', value: 'change again' },
		]);
	});

	it('not publish a value event after a child node updated notification', () => {
		const history: Array<NodeEvent<string | null, TestError>> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validate: async (data: TestFormData) => {
				if (!data?.address) return [];
				if (!data.address.street) return [];
				return [{ path: 'address.street', message: 'the field is invalid' }];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			subscriber: makeSubscriber(history),
			parent: addressField,
			field: 'street',
		});

		assert.deepStrictEqual(history, []);

		streetField.notify({ node: 'child' });

		assert.deepStrictEqual(history, []);
	});
});

describe('Field update notification', () => {
	it('process a notification from a parent node setting the field as modified', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validate: async (data: TestFormData) => {
				if (!data?.address) return [];
				if (!data.address.street) return [];
				return [{ path: 'address.street', message: 'the field is invalid' }];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
		});

		assert.strictEqual(streetField.isModified(), false);

		streetField.notify({ node: 'parent', value: 'fake' });

		assert.strictEqual(streetField.isModified(), true);
	});

	it('ignore any notification from a child node', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validate: async (data: TestFormData) => {
				if (!data?.address) return [];
				if (!data.address.street) return [];
				return [{ path: 'address.street', message: 'the field is invalid' }];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({
			parent: addressField,
			field: 'street',
		});

		// State assertion
		assert.deepStrictEqual(streetField.isTouched(), false);
		assert.deepStrictEqual(streetField.isActive(), false);
		assert.deepStrictEqual(streetField.isModified(), false);
		assert.deepStrictEqual(streetField.isValid(), true);
		assert.deepStrictEqual(streetField.getErrors(), []);

		streetField.notify({ node: 'child' });

		assert.deepStrictEqual(streetField.isTouched(), false);
		assert.deepStrictEqual(streetField.isActive(), false);
		assert.deepStrictEqual(streetField.isModified(), false);
		assert.deepStrictEqual(streetField.isValid(), true);
		assert.deepStrictEqual(streetField.getErrors(), []);
	});
});
