import { defineConfig } from "vite";

export default defineConfig({
        root: __dirname,
        cacheDir: "../../node_modules/.vite/",

        server: {
                port: 4200,
                host: "localhost",
        },

        preview: {
                port: 4300,
                host: "localhost",
        },
        publicDir: "../../public",
        assetsInclude: ["*.glb"],
        build: {
                outDir: "../../dist/physics/body",
                reportCompressedSize: true,
                commonjsOptions: {
                        transformMixedEsModules: true,
                },
        },

        test: {
                globals: true,
                cache: {
                        dir: "./node_modules/.vitest",
                },
                environment: "jsdom",
                include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

                reporters: ["default"],
                coverage: {
                        reportsDirectory: "../coverage",
                        provider: "v8",
                },
        },
});
