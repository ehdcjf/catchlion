import { defineConfig } from 'vite';

export default defineConfig({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/apps/004.resume',

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
		outDir: '../../dist/apps/004.resume',
		reportCompressedSize: true,
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
});
