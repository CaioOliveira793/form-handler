import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/FormApi';
import { Field } from '@/Field';
import { FieldGroup } from '@/FieldGroup';
import {
	ArrayComposer,
	ArrayGroupComposer,
	ObjectComposer,
	ObjectGroupComposer,
} from '@/GroupComposer';

interface Address {
	name: string;
	state: string;
	street: string;
}

interface Product {
	sku: string;
	price: number;
}

enum CheckoutPayment {
	CreditCard,
	GiftCard,
}

interface Checkout {
	payment: CheckoutPayment;
	products: Array<Product>;
	address: Address;
}

describe('FormApi composition', () => {
	it('create form and compose field nodes', () => {
		const formApi = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<Checkout>,
			submit: () => {},
		});

		/*const paymentNode = */ new Field({
			parent: formApi,
			field: 'payment',
			initial: CheckoutPayment.CreditCard,
		});
		const productsNode = new FieldGroup({
			parent: formApi,
			field: 'products',
			composer: ArrayGroupComposer as ArrayComposer<Product>,
		});
		/*const addressNode = */ new FieldGroup({
			parent: formApi,
			field: 'address',
			composer: ObjectGroupComposer as ObjectComposer<Address>,
			initial: null,
		});
		const product0Node = new FieldGroup({
			parent: productsNode,
			field: 0,
			composer: ObjectGroupComposer as ObjectComposer<Product>,
		});
		/*const product1skuNode = */ new Field({
			parent: product0Node,
			field: 'sku',
			initial: '123',
		});
		/*const product1priceNode = */ new Field({
			parent: product0Node,
			field: 'price',
			initial: 249.99,
		});

		assert.deepStrictEqual(formApi.getValue(), {
			payment: CheckoutPayment.CreditCard,
			products: [
				{
					sku: '123',
					price: 249.99,
				},
			],
			address: null,
		});
	});
});
