import { NodeError, NodeKey, Node } from '@/NodeType';

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

// TODO: merge "distributeReplaceErrors" and "distributeAppendErrors"

export function distributeReplaceErrors<E extends NodeError, K extends NodeKey, T>(
	errors: Array<E>,
	nodes: Map<K, Node<T, E>>
) {
	for (const node of nodes.values()) {
		const key = node.path();
		const nodeErrors = [];

		for (const error of errors) {
			if (error.path.startsWith(key)) {
				nodeErrors.push(error);
			}
		}

		node.setErrors(nodeErrors);
	}
}

export function distributeAppendErrors<E extends NodeError, K extends NodeKey, T>(
	errors: Array<E>,
	nodes: Map<K, Node<T, E>>
) {
	for (const node of nodes.values()) {
		const key = node.path();
		const nodeErrors = [];

		for (const error of errors) {
			if (error.path.startsWith(key)) {
				nodeErrors.push(error);
			}
		}

		node.appendErrors(nodeErrors);
	}
}
