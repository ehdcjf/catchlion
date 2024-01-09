/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
	root: __dirname,
	cacheDir: '../../node_modules/.vite/lighthouse',

	server: {
		port: 4200,
		host: 'localhost',
	},

	preview: {
		port: 4300,
		host: 'localhost',
	},
	publicDir: '../../public',
	plugins: [nxViteTsPaths()],

	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [ nxViteTsPaths() ],
	// },

	build: {
		outDir: '../dist/lighthouse',
		reportCompressedSize: true,
		//assetsDir: './public',
		commonjsOptions: {
			transformMixedEsModules: true,
		},
	},

	test: {
		globals: true,
		cache: {
			dir: '../node_modules/.vitest',
		},
		environment: 'jsdom',
		include: [
			'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
		],

		reporters: ['default'],
		coverage: {
			reportsDirectory: '../coverage/lighthouse',
			provider: 'v8',
		},
	},
});
