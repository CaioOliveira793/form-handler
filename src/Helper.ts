import { NodeError, NodeKey, FieldNode, NodeNotification, Option } from '@/NodeType';

/**
 * Group node used internally by the field node.
 */
export interface InternalGroupNode<K extends NodeKey, V, E extends NodeError> {
	attachNode(field: K, node: FieldNode<V, E>): string;
	detachNode(field: K): boolean;
	extractValue(field: K): Option<V>;
	patchValue(field: K, value: V): Option<unknown>;
	handleFocusWithin(): void;
	handleBlurWithin(): void;
	notify(notification: NodeNotification<unknown>): void;
}

/**
 * Equality comparison function.
 */
export type EqualFn<T = unknown> = (a: T | undefined, b: T | undefined) => boolean;

/**
 * Default equality comparison.
 *
 * @param a
 * @param b
 * @returns strict equality comparison `a === b`
 */
export function defaultEqualFn<T = unknown>(a: T | undefined, b: T | undefined): boolean {
	return a === b;
}

export function distributeReplaceErrors<E extends NodeError, K extends NodeKey, T>(
	errors: Array<E>,
	nodes: Map<K, FieldNode<T, E>>
) {
	for (const node of nodes.values()) {
		const field = node.path();
		const fieldErrors = [];

		for (const error of errors) {
			if (error.path.startsWith(field)) {
				fieldErrors.push(error);
			}
		}

		node.setErrors(fieldErrors);
	}
}

export function distributeAppendErrors<E extends NodeError, K extends NodeKey, T>(
	errors: Array<E>,
	nodes: Map<K, FieldNode<T, E>>
) {
	for (const node of nodes.values()) {
		const field = node.path();
		const fieldErrors = [];

		for (const error of errors) {
			if (error.path.startsWith(field)) {
				fieldErrors.push(error);
			}
		}

		node.appendErrors(fieldErrors);
	}
}
