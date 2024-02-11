import { NodeKey, GroupComposer } from '@/NodeType';

export type ArrayComposer<T> = GroupComposer<Array<T>, number, T>;

export const ArrayGroupComposer = Object.freeze({
	default() {
		return [];
	},
	patch(group: Array<unknown>, key: number, value: unknown): void {
		group[key] = value;
	},
	delete(group: Array<unknown>, key: number) {
		delete group[key];
	},
	extract(group: Array<unknown>, key: number): unknown {
		return group[key];
	},
}) as Readonly<ArrayComposer<unknown>>;

export function arrayComposer<T>(): ArrayComposer<T> {
	return ArrayGroupComposer as ArrayComposer<T>;
}

export type ObjectComposer<O extends object> = keyof O extends NodeKey
	? GroupComposer<O, keyof O, O[keyof O]>
	: GroupComposer<O, Extract<keyof O, NodeKey>, O[keyof O]>;

export const ObjectGroupComposer = Object.freeze({
	default() {
		return {};
	},
	patch(group: Record<string, unknown>, key: string, value: unknown): void {
		group[key] = value;
	},
	delete(group: Record<string, unknown>, key: string) {
		delete group[key];
	},
	extract(group: Record<string, unknown>, key: string): unknown {
		return group[key];
	},
}) as ObjectComposer<object>;

export function objectComposer<Obj extends object>(): ObjectComposer<Obj> {
	return ObjectGroupComposer as unknown as ObjectComposer<Obj>;
}
