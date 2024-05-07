import { Node, NodeGroup, NodeError, NodeKey, Option, NodeConsistency } from '@/NodeType';

/**
- [ ] TODO: node helper functions
	- [ ] `unshiftNodes(group, ...nodes): void`
		- Add "out of tree" nodes
	- [ ] `appendNodes(group, ...nodes): void`
	- [ ] `spliceNodes(group, startIndex: number, deleteCount: number, ...nodes)`
	- [ ] `shiftNodes(group, count: number): Array<Node<T, E>>`
*/

/**
 * Swap two nodes from the same group.
 *
 * @param group node group
 * @param keyA key from the node A
 * @param keyB key from the node B
 */
export function swapNode<
	G extends NodeGroup<T, K, V, E>,
	K extends NodeKey,
	T,
	V,
	E extends NodeError = NodeError,
>(group: G, keyA: K, keyB: K): void {
	const nodeA = group.getNode(keyA);
	const nodeB = group.getNode(keyB);

	if (nodeA) {
		nodeA.replaceGroup(group, keyB);
		group.attachNode(keyB, nodeA);
	}

	if (nodeB) {
		nodeB.replaceGroup(group, keyA);
		group.attachNode(keyA, nodeB);
	}
}

/**
 * Move a node from one key to another in the same group.
 *
 * @param group node group
 * @param srcKey source key
 * @param dstKey destination key
 * @returns previous node from the destination key
 */
export function moveNode<
	G extends NodeGroup<T, K, V, E>,
	K extends NodeKey,
	T,
	V,
	E extends NodeError = NodeError,
>(group: G, srcKey: K, dstKey: K, consistency?: NodeConsistency): Option<Node<V, E>> {
	const srcNode = group.getNode(srcKey);
	const removedNode = group.getNode(dstKey);

	if (!srcNode) return;

	// 1. sync node value
	const groupValue = group.getValue();
	if (groupValue) {
		const srcValue = group.composer.extract(groupValue, srcKey);
		group.composer.patch(groupValue, dstKey, srcValue as V);
		group.composer.patch(groupValue, srcKey, srcNode.getInitialValue() as V);
	}

	// 2. sync node errors
	// - move the srcKey errors into the dstKey
	// - clear the errors in the srcKey
	// TODO: use a lazy iterator based approach for the error distribution

	// 3. update the node and node group attachments
	srcNode.replaceGroup(group, dstKey, 'none');
	group.attachNode(dstKey, srcNode, 'none');
	// TODO: replace the srcNode state with the dstNode state
	// TODO: move the *child node map* from the dstNode to the srcNode (if the [src|dst]Node is a NodeGroup)
	// TODO: move the child nodes in the dstNode to the srcNode (if the [src|dst]Node is a NodeGroup)

	// TODO: use the consistency to update the nodes and dispatch the events
	consistency;

	// 4. TODO: return a "out of tree" (DetachedNode) as the removed node
	return removedNode;
}

/**
 * Attach a list of new nodes into the group.
 *
 * @param group node group
 * @param nodes list of nodes
 */
export function WIP_unshiftNodes<
	G extends NodeGroup<T, K, V, E>,
	K extends NodeKey,
	T extends Array<V>,
	V,
	E extends NodeError,
>(group: G, ...nodes: Array<Node<V, E>>) {
	const array = group.getValue();

	// 1. unshift values
	// 2. unshift the node states
	// 3. insert the new nodes

	const values = nodes.map(node => node.getValue());

	array?.unshift(...(values as V[]));
}
