import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NodeError } from '@/NodeType';
import { FormApi } from '@/FormApi';
import { objectComposer } from '@/GroupComposer';
import { Field } from '@/Field';
import { moveNode } from '@/NodeUtils';
import { TestError } from './TestUtils';

interface TestType {
	valueA: number;
	valueB: number;
}

describe('Node utils > move node', () => {
	it('move a node from one key to another in the same group', () => {
		const form = new FormApi<TestType, keyof TestType, number, NodeError>({
			composer: objectComposer<TestType>(),
		});

		const nodeA = Field.init({ parent: form, key: 'valueA', initial: 10 });

		assert.deepStrictEqual(form.getNode('valueA'), nodeA);
		assert.deepStrictEqual(form.getNode('valueB'), undefined);

		const removedNode = moveNode<typeof form, keyof TestType, TestType, number>(
			form,
			'valueA',
			'valueB'
		);

		assert.deepStrictEqual(removedNode, undefined);

		assert.deepStrictEqual(form.getNode('valueA'), undefined);
		assert.deepStrictEqual(form.getNode('valueB'), nodeA);
	});

	it('move a node between keys and return the node from the destination key', () => {
		const form = new FormApi<TestType, keyof TestType, number, NodeError>({
			composer: objectComposer<TestType>(),
		});

		const nodeA = Field.init({ parent: form, key: 'valueA', initial: 10 });
		const nodeB = Field.init({ parent: form, key: 'valueB', initial: 5 });

		assert.deepStrictEqual(form.getNode('valueA'), nodeA);
		assert.deepStrictEqual(form.getNode('valueB'), nodeB);

		const removedNode = moveNode<typeof form, keyof TestType, TestType, number>(
			form,
			'valueA',
			'valueB'
		);

		assert.deepStrictEqual(removedNode, nodeB);

		assert.deepStrictEqual(form.getNode('valueA'), undefined);
		assert.deepStrictEqual(form.getNode('valueB'), nodeA);
	});

	it('not move a node from the group when there is no node in the key', () => {
		const form = new FormApi<TestType, keyof TestType, number, NodeError>({
			composer: objectComposer<TestType>(),
		});

		assert.deepStrictEqual(form.getNode('valueA'), undefined);
		assert.deepStrictEqual(form.getNode('valueB'), undefined);

		const removedNode = moveNode<typeof form, keyof TestType, TestType, number>(
			form,
			'valueA',
			'valueB'
		);

		assert.strictEqual(removedNode, undefined);

		assert.deepStrictEqual(form.getNode('valueA'), undefined);
		assert.deepStrictEqual(form.getNode('valueB'), undefined);
	});

	it('move node usage', () => {
		const form = new FormApi<TestType, keyof TestType, number, TestError>({
			composer: objectComposer<TestType>(),
		});

		const fieldA = Field.init({ parent: form, key: 'valueA', initial: 200 });
		const fieldB = Field.init({ parent: form, key: 'valueB', initial: 10 });

		form.setValue({ valueA: 12, valueB: 6 });
		form.setErrors([
			{ path: 'valueA', message: 'error with value 12' },
			{ path: 'valueB', message: 'error with value 6' },
		]);

		assert.deepStrictEqual(fieldA.getValue(), 12);
		assert.deepStrictEqual(fieldB.getValue(), 6);

		const removedNode = moveNode<typeof form, keyof TestType, TestType, number, TestError>(
			form,
			'valueA',
			'valueB'
		);

		assert.deepStrictEqual(removedNode, fieldB);

		assert.deepStrictEqual(Array.from(form.iterateNodes()), [fieldA]);
		assert.deepStrictEqual(form.getValue(), { valueA: 200, valueB: 12 });
		assert.deepStrictEqual(form.getErrors(), [{ path: 'valueB', message: 'error with value 12' }]);

		assert.deepStrictEqual(fieldA.getValue(), 12);
		assert.deepStrictEqual(fieldA.getErrors(), [
			{ path: 'valueA', message: 'error with value 12' },
		]);
	});
});
