import { defineConfig } from 'vite';

export default defineConfig({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/scene/000.observable',

	server: {
		port: 4200,
		host: 'localhost',
	},

	preview: {
		port: 4300,
		host: 'localhost',
	},
	publicDir: '../../public',
	build: {
		outDir: '../../dist/scene/000.observable',
		reportCompressedSize: true,
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
});
