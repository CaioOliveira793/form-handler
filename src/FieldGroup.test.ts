import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/FormApi';
import { ObjectComposer, ObjectGroupComposer } from '@/GroupComposer';
import { TestAddress, TestFormData, delay } from '@/TestUtils';
import { FieldGroup } from '@/FieldGroup';
import { isDeepStrictEqual } from 'node:util';
import { Field } from './Field';

describe('FieldGroup state management', () => {
	it('change state on focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);
	});

	it('change state on focus within', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleFocusWithin();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state when the node within this group is focused', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		streetField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state on focus and blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);

		addressField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change parent state on field focus event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);

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

		addressField.handleFocus();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), true);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);

		addressField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('execute form validation on field focus event', () => {
		const history: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'focus',
			validate: async data => {
				history.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setValue({ state: 'NY', street: '' });
		addressField.handleFocus();

		assert.deepStrictEqual(history, [{ address: { state: 'NY', street: '' } }]);

		addressField.setValue({ state: 'TX', street: 'A' });
		addressField.handleFocus();

		assert.deepStrictEqual(history, [
			{ address: { state: 'NY', street: '' } },
			{ address: { state: 'TX', street: 'A' } },
		]);
	});

	it('change state on blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state on blur within', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.handleBlurWithin();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change state when the node within this group is blurred', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const streetField = new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		streetField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('change parent state on field blur event', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.handleBlur();

		assert.strictEqual(addressField.isTouched(), true);
		assert.strictEqual(addressField.isActive(), false);

		assert.strictEqual(form.isTouched(), true);
		assert.strictEqual(form.isActive(), false);
	});

	it('execute form validation on field blur event', () => {
		const history: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'blur',
			validate: async data => {
				history.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setValue({ state: 'CA', street: '' });
		addressField.handleBlur();

		assert.deepStrictEqual(history, [{ address: { state: 'CA', street: '' } }]);

		addressField.setValue({ state: 'L', street: '' });
		addressField.setValue({ state: 'LA', street: '' });
		addressField.handleBlur();

		assert.deepStrictEqual(history, [
			{ address: { state: 'CA', street: '' } },
			{ address: { state: 'LA', street: '' } },
		]);
	});

	it('change modified state on field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setValue({ state: 'unknown', street: 'undefined' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);
	});

	it('keep state as modified after reseting the field value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setValue({ state: '', street: '' });

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);

		addressField.reset();

		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.strictEqual(addressField.isModified(), true);
	});

	it('change parent state after a field value mutation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setValue('Av. San');

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

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isDirty(), false);

		addressField.setValue({ state: '', street: '' });

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), true);
	});

	it('change the field state to not dirty when its value is equal to the initial', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			equalFn: isDeepStrictEqual,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isDirty(), false);

		addressField.setValue({ state: 'BA', street: 'Av. S' });

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), true);

		addressField.setValue({} as TestAddress);

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), false);

		assert.deepStrictEqual(addressField.getInitialValue(), addressField.getValue());
	});

	it('change the field state to dirty after modifying the parent value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			equalFn: isDeepStrictEqual,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isDirty(), false);

		form.setValue({ name: 'User', address: { state: 'Virginia' } } as TestFormData);

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isDirty(), true);

		assert.notDeepStrictEqual(addressField.getInitialValue(), addressField.getValue());
		assert.deepStrictEqual(addressField.getValue(), { state: 'Virginia' });
	});

	it('execute form validation on field change event', () => {
		const history: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'value',
			validate: async data => {
				history.push(structuredClone(data));
				return [];
			},
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setValue({ state: '' } as TestAddress);

		assert.deepStrictEqual(history, [{ address: {} }, { address: { state: '' } }]);

		addressField.setValue({ state: 'V' } as TestAddress);

		assert.deepStrictEqual(history, [
			{ address: {} },
			{ address: { state: '' } },
			{ address: { state: 'V' } },
		]);
	});

	it('change the field state to invalid when an error is present in the field', async () => {
		const history: Array<TestFormData> = [];
		const form = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validationTrigger: 'value',
			validate: async data => {
				history.push(structuredClone(data));

				if (!data.address) return [];
				if (!data.address.street) return [];
				return [{ message: 'Invalid street name', path: 'address.street' }];
			},
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setValue({ state: 'valid', street: 'invalid' });

		await delay(10);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ message: 'Invalid street name', path: 'address.street' },
		]);

		assert.strictEqual(nameField.isValid(), true);
		assert.deepStrictEqual(nameField.getErrors(), []);
	});

	it('change the field state to modified after patching the value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.patchValue('street', 'some');

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('not change the field state to modified after patching a nullish value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			initial: null,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		addressField.patchValue('street', 'some');

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
		assert.deepStrictEqual(addressField.getValue(), null);
	});

	it('change the field state to modified after attaching a node into the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(addressField.isModified(), true);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
	});

	it('not change the field state to modified after attaching a node into the group with a nullish value', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			initial: null,
		});

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);

		new Field({ parent: addressField, field: 'street' });

		assert.strictEqual(addressField.isModified(), false);
		assert.strictEqual(addressField.isTouched(), false);
		assert.strictEqual(addressField.isActive(), false);
	});
});
