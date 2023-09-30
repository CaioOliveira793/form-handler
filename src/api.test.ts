import { describe, it } from 'node:test';
import { default as assert } from 'node:assert';
import { FormApi } from '@/lib';
import { FieldControl } from '@/FieldControl';
import { FieldGroupControl } from '@/FieldGroupControl';
import {
	ArrayComposer,
	ArrayGroupComposer,
	ObjectComposer,
	ObjectGroupComposer,
} from '@/GroupComposer';
import { FormState } from '@/FormState';

// type Nullable<T> = { [P in keyof T]: T[P] | null; };

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
	const INITIAL_CHEKOUT = {
		address: null,
		payment: null,
		products: null,
	} as unknown as Checkout;
	const INITIAL_ADDRESS = {
		name: null,
		state: null,
		street: null,
	} as unknown as Address;

	it('create form and field nodes', () => {
		const form = new FormState<Checkout>({ value: {} as Checkout });
		const formApi = new FormApi({
			form,
			initial: INITIAL_CHEKOUT,
			composer: ObjectGroupComposer as ObjectComposer<Checkout>,
		});

		/*const paymentNode = */ new FieldControl({
			form,
			field: 'payment',
			initial: null as unknown as CheckoutPayment,
			parent: formApi,
		});
		/*const productsNode =*/ new FieldGroupControl({
			form,
			field: 'products',
			initial: [],
			parent: formApi,
			composer: ArrayGroupComposer as ArrayComposer<Product>,
		});
		/*const addressNode = */ new FieldGroupControl({
			form,
			field: 'address',
			initial: INITIAL_ADDRESS,
			parent: formApi,
			composer: ObjectGroupComposer as ObjectComposer<Address>,
		});

		assert.deepStrictEqual(form.getValue(), {
			payment: null,
			products: [],
			address: structuredClone(INITIAL_ADDRESS),
		});
	});
});
