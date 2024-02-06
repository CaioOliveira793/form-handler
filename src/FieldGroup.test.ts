import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isDeepStrictEqual } from 'node:util';
import { FormApi } from '@/FormApi';
import { ObjectComposer, ObjectGroupComposer } from '@/GroupComposer';
import { TestAddress, TestError, TestFormData, delay } from '@/TestUtils';
import { FieldGroup } from '@/FieldGroup';
import { Field } from '@/Field';
import { FieldNode, NodeError } from '@/NodeType';

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

describe('FieldGroup error manipulation', () => {
	it('replace the errors of a field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const nameField = new Field({ parent: form, field: 'name' });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});

		addressField.setErrors([
			{ message: 'error#1', path: 'address' },
			{ message: 'error#2', path: 'address' },
		]);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ message: 'error#1', path: 'address' },
			{ message: 'error#2', path: 'address' },
		]);

		assert.strictEqual(form.isFormValid(), false);

		assert.strictEqual(nameField.isValid(), true);
		assert.deepStrictEqual(nameField.getErrors(), []);

		addressField.setErrors([{ message: 'error#0', path: 'address' }]);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [{ message: 'error#0', path: 'address' }]);

		assert.strictEqual(form.isFormValid(), false);
	});

	it('propagate errors from the field', () => {
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

		addressField.setErrors([
			{ path: 'address', message: 'address invalid' },
			{ path: 'address.street', message: 'street invalid' },
			{ path: 'address.street', message: 'street invalid again' },
			{ path: 'address.state', message: 'no state' },
		]);

		assert.strictEqual(form.isFormValid(), false);
		assert.strictEqual(form.isValid(), true);
		assert.deepStrictEqual(form.getErrors(), []);

		assert.strictEqual(nameField.isValid(), true);
		assert.deepStrictEqual(nameField.getErrors(), []);

		assert.strictEqual(addressField.isValid(), false);
		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'address invalid' },
		]);

		assert.strictEqual(streetField.isValid(), false);
		assert.deepStrictEqual(streetField.getErrors(), [
			{ path: 'address.street', message: 'street invalid' },
			{ path: 'address.street', message: 'street invalid again' },
		]);

		assert.strictEqual(stateField.isValid(), false);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'no state' },
		]);
	});

	it('handle and distribute errors from the validation function', async () => {
		async function validationFn(data: TestFormData): Promise<Array<TestError>> {
			const errors = [];
			if (data.address) {
				errors.push({ path: 'address', message: 'invalid address' });
			}
			if (data.address.state) {
				errors.push({ path: 'address.state', message: 'invalid address state' });
			}
			return errors;
		}
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
			validate: validationFn,
			validationTrigger: 'value',
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		stateField.setValue('anything');

		await delay(10);

		assert.deepStrictEqual(addressField.getErrors(), [
			{ path: 'address', message: 'invalid address' },
		]);
		assert.deepStrictEqual(stateField.getErrors(), [
			{ path: 'address.state', message: 'invalid address state' },
		]);
	});
});

describe('FieldGroup value mutation', () => {
	it('start the field with the initial value from the group', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });

		const state = new Field({ parent: addressField, field: 'state' });

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });
		assert.deepStrictEqual(state.getValue(), 'Texas');
	});

	it('start the field with the initial value from the attached field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });

		const state = new Field({ parent: addressField, field: 'state', initial: 'Indiana' });

		assert.deepStrictEqual(addressField.getValue(), { state: 'Indiana' });
		assert.deepStrictEqual(state.getValue(), 'Indiana');
	});

	it('get the initial value from the field', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});

		assert.deepStrictEqual(addressField.getInitialValue(), { state: 'Texas' });
	});

	it('set the field value', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const state = new Field({ parent: addressField, field: 'state' });

		addressField.setValue({ state: 'Texas' } as TestAddress);

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas' });
		assert.deepStrictEqual(state.getValue(), 'Texas');
	});

	it('reset the field value to it initial state', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
			initial: { state: 'Texas' } as TestAddress,
		});
		const stateField = new Field({ parent: addressField, field: 'state' });
		const streetField = new Field({ parent: addressField, field: 'street' });

		addressField.setValue({ state: 'Indiana', street: '334 Hickle Cliffs Suite 649' });

		assert.deepStrictEqual(addressField.getValue(), {
			state: 'Indiana',
			street: '334 Hickle Cliffs Suite 649',
		});
		assert.deepStrictEqual(stateField.getValue(), 'Indiana');
		assert.deepStrictEqual(streetField.getValue(), '334 Hickle Cliffs Suite 649');

		addressField.reset();

		assert.deepStrictEqual(addressField.getValue(), { state: 'Texas', street: undefined });
		assert.deepStrictEqual(stateField.getValue(), 'Texas');
		assert.deepStrictEqual(streetField.getValue(), undefined);
	});

	it('patch the field value in the group', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const stateField = new Field({ parent: addressField, field: 'state' });
		const streetField = new Field({ parent: addressField, field: 'street' });

		{
			const address = addressField.patchValue('state', 'Indiana');
			assert.deepStrictEqual(address, { state: 'Indiana', street: undefined });
		}

		assert.deepStrictEqual(addressField.getValue(), { state: 'Indiana', street: undefined });
		assert.deepStrictEqual(stateField.getValue(), 'Indiana');
		assert.deepStrictEqual(streetField.getValue(), undefined);

		{
			const address = addressField.patchValue('street', '15970 Spinka Island Suite 086');
			assert.deepStrictEqual(address, {
				state: 'Indiana',
				street: '15970 Spinka Island Suite 086',
			});
		}

		assert.deepStrictEqual(addressField.getValue(), {
			state: 'Indiana',
			street: '15970 Spinka Island Suite 086',
		});
		assert.deepStrictEqual(stateField.getValue(), 'Indiana');
		assert.deepStrictEqual(streetField.getValue(), '15970 Spinka Island Suite 086');
	});

	it('extract the field value from the group', () => {
		const form = new FormApi<TestFormData, keyof TestFormData, string | TestAddress, TestError>({
			composer: ObjectGroupComposer as ObjectComposer<TestFormData>,
		});
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const stateField = new Field({ parent: addressField, field: 'state' });

		stateField.setValue('Montana');

		const state = addressField.extractValue('state');

		assert.strictEqual(state, 'Montana');
		assert.deepStrictEqual(addressField.getValue(), { state: 'Montana' });
	});
});

describe('FieldGroup node composition', () => {
	it('attach a node into the group on the node creation', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const stateField = new Field({ field: 'state', parent: addressField });

		const stateNode = addressField.getNode('state');
		assert.equal(stateNode, stateField);

		const streetNode = addressField.getNode('street');
		assert.equal(streetNode, undefined);
	});

	it('detach a node from the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		new Field({ field: 'state', parent: addressField });

		{
			const detached = addressField.detachNode('state');
			assert.strictEqual(detached, true);
		}
		{
			const detached = addressField.detachNode('street');
			assert.strictEqual(detached, false);
		}
		{
			const detached = addressField.detachNode('state');
			assert.strictEqual(detached, false);
		}
	});

	it('iterate all the nodes attached in the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const stateField = new Field({ field: 'state', parent: addressField });
		const streetField = new Field({ field: 'street', parent: addressField });

		const fields: Array<FieldNode<string, NodeError>> = [stateField, streetField];

		let count = 0;
		for (const node of addressField.iterateNodes()) {
			assert.strictEqual(fields.includes(node), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});

	it('iterate all the fields from nodes attached in the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		new Field({ field: 'state', parent: addressField });
		new Field({ field: 'street', parent: addressField });

		const fields: Array<string> = ['state', 'street'];

		let count = 0;
		for (const field of addressField.iterateFields()) {
			assert.strictEqual(fields.includes(field), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});

	it('iterate all the field and node entries attached in the group', () => {
		const form = new FormApi({ composer: ObjectGroupComposer as ObjectComposer<TestFormData> });
		const addressField = new FieldGroup({
			parent: form,
			composer: ObjectGroupComposer as ObjectComposer<TestAddress>,
			field: 'address',
		});
		const stateField = new Field({ field: 'state', parent: addressField });
		const streetField = new Field({ field: 'street', parent: addressField });

		const fields: Array<string> = ['state', 'street'];
		const nodes: Array<FieldNode<string, NodeError>> = [stateField, streetField];

		let count = 0;
		for (const [field, node] of addressField.iterateEntries()) {
			assert.strictEqual(fields.includes(field), true);
			assert.strictEqual(nodes.includes(node), true);
			count += 1;
		}

		assert.strictEqual(count, 2);
	});
});
