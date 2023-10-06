import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NodeEventListener, NodeUnsubscriber } from '@/NodeEventListener';

interface PublishHistory<T> {
	/** Published topic */
	published: string;
	/** Subscribed topic */
	subscribed: string;
	/** Event */
	event: T;
}

function makeListener<T>(
	pubsub: NodeEventListener<T>,
	topic: string,
	history: Array<PublishHistory<T>>
): NodeUnsubscriber {
	function subscriber(published: string, event: T) {
		history.push({ published, subscribed: topic, event });
	}
	return pubsub.subscribe(topic, subscriber);
}

describe('NodePubSub', () => {
	it('bubble up the subscribed key', () => {
		const nodepubsub = new NodeEventListener<string | number>();
		const history: Array<PublishHistory<string | number>> = [];

		makeListener(nodepubsub, 'address.name', history);
		makeListener(nodepubsub, 'address.street', history);
		makeListener(nodepubsub, 'address', history);

		makeListener(nodepubsub, 'products.0.price', history);
		makeListener(nodepubsub, 'products.1.price', history);
		makeListener(nodepubsub, 'products.0', history);
		makeListener(nodepubsub, 'products.1', history);
		makeListener(nodepubsub, 'products', history);

		nodepubsub.bubble('address.name', 'Home');

		assert.deepStrictEqual(history, [
			{ published: 'address.name', subscribed: 'address.name', event: 'Home' },
			{ published: 'address.name', subscribed: 'address', event: 'Home' },
		]);

		history.length = 0;
		nodepubsub.bubble('products.0.price', 356.28);

		assert.deepStrictEqual(history, [
			{ published: 'products.0.price', subscribed: 'products.0.price', event: 356.28 },
			{ published: 'products.0.price', subscribed: 'products.0', event: 356.28 },
			{ published: 'products.0.price', subscribed: 'products', event: 356.28 },
		]);
	});

	it.skip('narrow down the subscribed key', () => {
		const nodepubsub = new NodeEventListener<string | number>();
		const history: Array<PublishHistory<string | number>> = [];

		makeListener(nodepubsub, 'address.name', history);
		makeListener(nodepubsub, 'address.street', history);
		makeListener(nodepubsub, 'address', history);

		makeListener(nodepubsub, 'products.0.price', history);
		makeListener(nodepubsub, 'products.1.price', history);
		makeListener(nodepubsub, 'products.0', history);
		makeListener(nodepubsub, 'products.1', history);
		makeListener(nodepubsub, 'products', history);

		nodepubsub.narrow('address', 'Home');

		assert.deepStrictEqual(history, [
			{ published: 'address', subscribed: 'address', event: 'Home' },
			{ published: 'address', subscribed: 'address.name', event: 'Home' },
			{ published: 'address', subscribed: 'address.street', event: 'Home' },
		]);

		history.length = 0;
		nodepubsub.bubble('products', 356.28);

		assert.deepStrictEqual(history, [
			{ published: 'products', subscribed: 'products', event: 356.28 },
			{ published: 'products', subscribed: 'products.0', event: 356.28 },
			{ published: 'products', subscribed: 'products.0.price', event: 356.28 },
			{ published: 'products', subscribed: 'products.1', event: 356.28 },
			{ published: 'products', subscribed: 'products.1.price', event: 356.28 },
		]);
	});
});
