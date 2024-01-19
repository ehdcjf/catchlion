import { defineConfig } from 'vite';

export default defineConfig({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/physics/006.Pendulum',

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
		outDir: '../../dist/physics/006.Pendulum',
		reportCompressedSize: true,
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},
});
