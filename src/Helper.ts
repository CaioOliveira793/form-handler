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

export function distributeErrors<E extends NodeError, K extends NodeKey, T>(
	errors: Array<E>,
	nodes: Map<K, FieldNode<T, E>>,
	fieldPrefix: string = ''
) {
	for (const [key, node] of nodes.entries()) {
		const field = fieldPrefix + key.toString();
		const fieldErrors = [];

		for (const error of errors) {
			if (error.path.startsWith(field)) {
				fieldErrors.push(error);
			}
		}

		node.handleValidation(fieldErrors);
	}
}
