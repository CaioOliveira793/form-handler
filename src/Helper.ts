import { NodeError, NodeKey, FieldNode } from '@/NodeType';

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
