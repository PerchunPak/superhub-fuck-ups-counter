import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'import.meta.vitest': 'undefined'
	},
	test: {
		globals: true,
		environment: 'jsdom',
		includeSource: ['{src,test}/**/*.{js,ts}']
	}
});
