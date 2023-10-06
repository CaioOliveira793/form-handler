import { describe, it } from 'node:test';
import assert from 'node:assert';
import { FormApi } from '@/lib';
import { FieldControl } from '@/FieldControl';
import { FieldGroupControl } from '@/FieldGroupControl';
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
	sku: number;
	name: string;
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

describe('FormApi', () => {
	it('create form and field nodes', () => {
		const formApi = new FormApi({
			composer: ObjectGroupComposer as ObjectComposer<Checkout>,
		});

		/*const paymentNode = */ new FieldControl({
			field: 'payment',
			initial: null as unknown as CheckoutPayment,
			parent: formApi,
		});
		/*const productsNode =*/ new FieldGroupControl({
			field: 'products',
			parent: formApi,
			composer: ArrayGroupComposer as ArrayComposer<Product>,
		});
		/*const addressNode = */ new FieldGroupControl({
			field: 'address',
			parent: formApi,
			composer: ObjectGroupComposer as ObjectComposer<Address>,
		});

		assert.deepStrictEqual(formApi.getValue(), {
			payment: null,
			products: [],
			address: {},
		});
	});
});
