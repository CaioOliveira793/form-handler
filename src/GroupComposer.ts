import { GroupComposer } from './Field';

export type ArrayComposer<T> = GroupComposer<Array<T>, number, T>;

export const ArrayGroupComposer = {
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
	extract(group: Array<unknown>, key: number): unknown {
		return group[key];
	},
} as ArrayComposer<unknown>;

export type ObjectComposer<O extends object> = GroupComposer<O, keyof O, O[keyof O]>;

export const ObjectGroupComposer = {
	assemble(attributes: Array<[string, unknown]>): Record<string, unknown> {
		return Object.fromEntries(attributes);
	},
	patch(group: Record<string, unknown>, key: string, value: unknown): void {
		group[key] = value;
	},
	extract(group: Record<string, unknown>, key: string): unknown {
		return group[key];
	},
} as ObjectComposer<object>;
