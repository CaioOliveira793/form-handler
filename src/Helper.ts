import { NodeError, FieldKey, FieldNode } from '@/Field';

export function distributeErrors<E extends NodeError, K extends FieldKey, T>(
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
