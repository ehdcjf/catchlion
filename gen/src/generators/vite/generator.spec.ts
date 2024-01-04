import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { viteGenerator } from './generator';
import { ViteGeneratorSchema } from './schema';

describe('vite generator', () => {
	let tree: Tree;
	const options: ViteGeneratorSchema = { name: 'test' };

	beforeEach(() => {
		tree = createTreeWithEmptyWorkspace();
	});

	it('should run successfully', async () => {
		await viteGenerator(tree, options);
		const config = readProjectConfiguration(tree, 'test');
		expect(config).toBeDefined();
	});
});
