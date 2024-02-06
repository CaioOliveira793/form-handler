import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/FormApi';
import { Field } from '@/Field';
import { FieldGroup } from '@/FieldGroup';
import { ObjectComposer, ObjectGroupComposer } from '@/GroupComposer';
import { NodeError } from '@/NodeType';
import { TestAddress, TestError, TestFormData, delay } from '@/TestUtils';

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
