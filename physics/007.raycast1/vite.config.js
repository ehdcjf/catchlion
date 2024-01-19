import { defineConfig } from 'vite';

export default defineConfig({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/physics/007.raycast1',

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
		outDir: '../../dist/physics/007.raycast1',
		reportCompressedSize: true,
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
});
