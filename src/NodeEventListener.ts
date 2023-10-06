export type NodeListener<T> = (key: string, event: T) => void;

export type NodeUnsubscriber = () => void;

const TOPIC_SEPARATOR = '.';

export class NodeEventListener<T> {
	public constructor() {
		this.subscribers = new Map();
	}

	public subscribe(key: string, subscriber: NodeListener<T>): NodeUnsubscriber {
		this.subscribers.set(key, subscriber);
		return () => {
			this.subscribers.delete(key);
		};
	}

	/**
	 * Dispatch events to all nodes subscribed to this key.
	 *
	 * @param key Node key.
	 * @param event
	 */
	public bubble(key: string, event: T): void {
		let topic = key;
		let lastSeparator = 0;

		do {
			this.subscribers.get(topic)?.(key, event);
			lastSeparator = topic.lastIndexOf(TOPIC_SEPARATOR);
			topic = topic.slice(0, lastSeparator);
		} while (lastSeparator !== -1);
	}

	public narrow(key: string, event: T): void {
		let topic = key;
		let lastSeparator = 0;

		do {
			this.subscribers.get(topic)?.(key, event);
			lastSeparator = topic.indexOf(TOPIC_SEPARATOR);
			topic = topic.slice(lastSeparator);
		} while (lastSeparator !== -1);
	}

	private readonly subscribers: Map<string, NodeListener<T>>;
}
