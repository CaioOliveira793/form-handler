import { NodeError, NodeEvent, NodeSubscriber } from '@/NodeType';

export type Nullable<T> = { [P in keyof T]: T[P] | null };

export interface TestAddress {
	state: string;
	street: string;
}

export interface TestData {
	name: string;
	email: string;
	address: TestAddress;
}

export interface TestError extends NodeError {
	message: string;
}

export function delay(time: number): Promise<void> {
	return new Promise(resolver => setTimeout(resolver, time));
}

export function makeSubscriber<T, E extends NodeError>(
	history: Array<NodeEvent<T, E>>
): NodeSubscriber<T, E> {
	return function subscriber(event: NodeEvent<T, E>) {
		history.push(structuredClone(event));
	};
}
