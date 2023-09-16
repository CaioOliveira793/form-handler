import { fileURLToPath, URL } from 'node:url';

export default {
	plugins: [],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@test': fileURLToPath(new URL('./test', import.meta.url)),
		},
	},
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'c8',
			reporter: ['text', 'html'],
		},
	},
};
