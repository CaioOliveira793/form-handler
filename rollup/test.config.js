import path from 'node:path';
import typescript from '@rollup/plugin-typescript';
import { sync as globSync } from 'glob';

// TODO: use node test runner without rollup compile step.

const OUTPUT_DIR = 'test-build';

/**
 * @returns {Record<string, string>}
 */
function makeInput() {
	return Object.fromEntries(
		globSync('src/**/*.test.ts').map(file => [makeTestFilename(file), file])
	);
}

/**
 * @param {string} file
 * @returns {string}
 */
function makeTestFilename(file) {
	return path
		.relative('src', file.slice(0, file.length - path.extname(file).length))
		.replace(/\//g, '-');
}

/** @type {import('rollup').RollupOptions} */
export default {
	input: makeInput(),
	external: [/^node:/],
	plugins: [
		typescript({
			include: ['src/**/*.ts'],
			outDir: OUTPUT_DIR,
		}),
	],
	output: {
		dir: OUTPUT_DIR,
		entryFileNames: '[name].js',
		sourcemap: true,
		format: 'es',
	},
};
