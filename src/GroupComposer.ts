import { FieldKey, GroupComposer } from './Field';

export type ArrayComposer<T> = GroupComposer<Array<T>, number, T>;

export const ArrayGroupComposer = {
	default() {
		return [];
	},
	assemble(attributes: Array<[number, unknown]>): Array<unknown> {
		const group = [];
		for (const [key, val] of attributes) {
			group[key] = val;
		}
		return group;
	},
	patch(group: Array<unknown>, key: number, value: unknown): void {
		group[key] = value;
	},
	delete(group, key) {
		delete group[key];
	},
	extract(group: Array<unknown>, key: number): unknown {
		return group[key];
	},
} as ArrayComposer<unknown>;

export type ObjectComposer<O extends object> = keyof O extends FieldKey
	? GroupComposer<O, keyof O, O[keyof O]>
	: GroupComposer<O, Extract<keyof O, FieldKey>, O[keyof O]>;

export const ObjectGroupComposer = {
	default() {
		return {};
	},
	assemble(attributes: Array<[string, unknown]>): Record<string, unknown> {
		return Object.fromEntries(attributes);
	},
	patch(group: Record<string, unknown>, key: string, value: unknown): void {
		group[key] = value;
	},
	delete(group, key) {
		delete group[key];
	},
	extract(group: Record<string, unknown>, key: string): unknown {
		return group[key];
	},
} as ObjectComposer<object>;
