import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/FormApi';
import { Field } from '@/Field';
import { FieldGroup } from '@/FieldGroup';
import { ObjectComposer, ObjectGroupComposer } from '@/GroupComposer';
import { NodeError } from '@/NodeType';
import { TestAddress, TestError, TestFormData, delay } from '@/TestUtils';

describe('FormApi state management', () => {
	it('change the form field to invalid when an error is prensent in the root field', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		form.setErrors([{ path: '.', message: 'root field message' } as TestError]);

		assert.deepStrictEqual(form.isValid(), false);
		assert.deepStrictEqual(form.getErrors(), [{ path: '.', message: 'root field message' }]);
	});

	it('change the form state to invalid when an error is prensent in any field of the form', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), false);
		assert.deepStrictEqual(form.getErrors('group'), [
			{ path: 'address.street', message: 'address street message' },
		]);

		form.clearErrors('group');

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), true);
		assert.deepStrictEqual(form.getErrors('group'), []);

		nameField.setErrors([{ path: 'name', message: 'name message' } as TestError]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), false);
		assert.deepStrictEqual(form.getErrors('group'), [{ path: 'name', message: 'name message' }]);
	});

	it('change the form to valid when the all errors are removed', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });

		nameField.setErrors([{ path: 'name', message: 'name message' } as TestError]);
		streetField.setErrors([
			{ path: 'address.street', message: 'address street message' } as TestError,
		]);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid('group'), false);
		assert.deepStrictEqual(form.getErrors('group').length, 2);

		form.clearErrors('group');

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.deepStrictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);
	});
});

describe('FormApi form submission', () => {
	it('submit the data in the form', async () => {
		const history: Array<TestFormData> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			submit: function (data: TestFormData) {
				history.push(structuredClone(data));
			},
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			field: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('TX');

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			});
		}

		const state = await form.submitAsync();
		assert.strictEqual(state, 'success');

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			},
		]);
	});

	it('throw a validation error when submitting the form', async () => {
		const history: Array<TestFormData> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			submit: async function (data: TestFormData) {
				history.push(structuredClone(data));
			},
			validate: async function (data: TestFormData) {
				const errors = [];

				if (data?.address?.state !== undefined) {
					errors.push({ path: 'address.state', message: 'address state error' });
				}

				return errors;
			},
			validationTrigger: 'value',
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			field: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					street: 'St. a',
				},
			});

			await delay(10);

			const errors = form.getErrors();
			assert.deepStrictEqual(errors, []);

			const state = await form.submitAsync();
			assert.strictEqual(state, 'success');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);

		stateField.setValue('NY');

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					street: 'St. a',
					state: 'NY',
				},
			});

			await delay(10);

			const errors = stateField.getErrors();
			assert.deepStrictEqual(errors, [{ path: 'address.state', message: 'address state error' }]);
		}

		{
			const state = await form.submitAsync();
			assert.strictEqual(state, 'validation_error');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);
	});

	it('throw a submit error when submitting the form', async () => {
		const history: Array<TestFormData> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			submit: async function (data: TestFormData) {
				const errors: Array<TestError> = [];

				if (data?.address?.state !== undefined) {
					errors.push({ path: 'address.state', message: 'address state error' });
					return errors;
				}

				history.push(structuredClone(data));
				return errors;
			},
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			field: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);

		{
			const state = await form.submitAsync();
			assert.strictEqual(state, 'success');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);

		stateField.setValue('NY');

		{
			const state = await form.submitAsync();
			assert.strictEqual(state, 'submit_error');
		}

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: { street: 'St. a' },
			},
		]);

		const errors = stateField.getErrors();
		assert.deepStrictEqual(errors, [{ path: 'address.state', message: 'address state error' }]);
	});

	it('execute the asynchronous submit function in the background', async () => {
		const history: Array<TestFormData> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			submit: function (data: TestFormData) {
				history.push(structuredClone(data));
			},
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			field: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('TX');

		{
			const value = form.getValue();
			assert.deepStrictEqual(value, {
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			});
		}

		form.submit();

		assert.deepStrictEqual(history, []);

		await delay(10);

		assert.deepStrictEqual(history, [
			{
				name: 'Carl',
				address: {
					state: 'TX',
					street: 'St. a',
				},
			},
		]);
	});

	it('catch an error thrown from the submit function', async () => {
		const history: Array<TestFormData> = [];
		const errorHistory: Array<unknown> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			submit: async function (data: TestFormData) {
				const errors: Array<TestError> = [];

				if (data?.address?.state !== undefined) {
					throw 'should not happen in submit';
				}

				history.push(structuredClone(data));
				return errors;
			},
			submitRejection: function (err: unknown) {
				errorHistory.push(err);
			},
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			field: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('NY');

		form.submit();

		await delay(10);

		assert.deepStrictEqual(history, []);

		const errors = stateField.getErrors();
		assert.deepStrictEqual(errors, []);

		assert.deepStrictEqual(errorHistory, ['should not happen in submit']);
	});

	it('catch an error thrown from the validation function', async () => {
		const history: Array<TestFormData> = [];
		const errorHistory: Array<unknown> = [];

		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, NodeError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			submit: async function (data: TestFormData) {
				history.push(structuredClone(data));
			},
			validateRejection: function (err: unknown) {
				errorHistory.push(err);
			},
			validate: async function (data: TestFormData) {
				const errors: Array<TestError> = [];

				if (data?.address?.state !== undefined) {
					throw 'should not happen in validate';
				}

				return errors;
			},
			validationTrigger: 'value',
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			field: 'address',
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		nameField.setValue('Carl');
		addressField.setValue({ street: 'St. a' } as TestAddress);
		stateField.setValue('NY');

		await delay(10);

		assert.deepStrictEqual(errorHistory, ['should not happen in validate']);

		form.submit();

		await delay(10);

		assert.deepStrictEqual(history, []);

		const errors = stateField.getErrors();
		assert.deepStrictEqual(errors, []);

		assert.deepStrictEqual(errorHistory, [
			'should not happen in validate',
			'should not happen in validate',
		]);
	});
});

describe('FormApi error manipulation', () => {
	it('set the errors in the form root field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		form.setErrors([
			{ message: 'root form error', path: '.' },
			{ message: 'name error', path: 'name' },
		]);

		assert.strictEqual(form.isValid(), false);
		assert.deepStrictEqual(form.getErrors(), [{ message: 'root form error', path: '.' }]);

		assert.strictEqual(addressField.isValid(), true);
		assert.deepStrictEqual(addressField.getErrors(), []);

		assert.strictEqual(nameField.isValid(), false);
		assert.deepStrictEqual(nameField.getErrors(), [{ message: 'name error', path: 'name' }]);
	});

	it('propagate errors from the form root field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		form.setErrors([
			{ path: '.', message: 'root form error' },
			{ path: 'address', message: 'address error' },
			{ path: 'address.street', message: 'street error 1' },
			{ path: 'address.street', message: 'street error 2' },
			{ path: 'address.state', message: 'state error' },
		]);

		assert.strictEqual(form.isValid(), false);
		assert.deepStrictEqual(form.getErrors(), [{ path: '.', message: 'root form error' }]);

		assert.strictEqual(nameField.isValid(), true);
		assert.deepStrictEqual(nameField.getErrors(), []);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address error' },
		]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'street error 1' },
			{ path: 'address.street', message: 'street error 2' },
		]);

		assert.strictEqual(stateField.isValid(), false);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'state error' },
		]);
	});

	it('return all the errors in the form', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		form.setErrors([{ path: '.', message: 'root error' }]);
		nameField.setErrors([{ path: 'name', message: 'name error' }]);
		addressField.setErrors([{ path: 'address', message: 'address error' }]);
		streetField.setErrors([{ path: 'address.street', message: 'address street error' }]);
		stateField.setErrors([{ path: 'address.state', message: 'address state error' }]);

		{
			const errors = form.getErrors();
			assert.deepStrictEqual(errors, [{ path: '.', message: 'root error' }]);
		}

		const errors = form.getErrors('group');
		assert.deepStrictEqual(errors.length, 5);
	});

	it('clear all the errors in the form', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		form.setErrors([{ path: '.', message: 'root error' }]);
		nameField.setErrors([{ path: 'name', message: 'name error' }]);
		addressField.setErrors([{ path: 'address', message: 'address error' }]);
		streetField.setErrors([{ path: 'address.street', message: 'address street error' }]);
		stateField.setErrors([{ path: 'address.state', message: 'address state error' }]);

		{
			const errors = form.getErrors('group');
			assert.deepStrictEqual(errors.length, 5);
		}

		form.clearErrors('group');

		assert.deepStrictEqual(form.getErrors('group'), []);
	});

	it('clear all the errors in the form root field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });
		const stateField = new Field({ parent: addressField, field: 'state' });

		form.setErrors([{ path: '.', message: 'root error' }]);
		nameField.setErrors([{ path: 'name', message: 'name error' }]);
		addressField.setErrors([{ path: 'address', message: 'address error' }]);
		streetField.setErrors([{ path: 'address.street', message: 'address street error' }]);
		stateField.setErrors([{ path: 'address.state', message: 'address state error' }]);

		{
			assert.deepStrictEqual(form.getErrors('current').length, 1);
			assert.deepStrictEqual(form.getErrors('group').length, 5);
		}

		form.clearErrors('current');

		assert.deepStrictEqual(form.getErrors('current').length, 0);
		assert.deepStrictEqual(form.getErrors('group').length, 4);
	});
});
