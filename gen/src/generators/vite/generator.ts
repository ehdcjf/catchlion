import {
	addProjectConfiguration,
	formatFiles,
	generateFiles,
	joinPathFragments,
	ProjectConfiguration,
	TargetConfiguration,
	Tree,
} from '@nx/devkit';
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { Linter } from '@nx/eslint';

import * as path from 'path';
import { ViteGeneratorSchema } from './schema';

async function normalizeOptions(host: Tree, options: any): Promise<any> {
	const {
		projectName: appProjectName,
		projectRoot: appProjectRoot,
		projectNameAndRootFormat,
	} = await determineProjectNameAndRootOptions(host, {
		name: options.name,
		projectType: 'application',
		directory: options.directory,
		projectNameAndRootFormat: options.projectNameAndRootFormat,
		callingGenerator: '@catchlion/gen:vite',
	});
	options.projectNameAndRootFormat = projectNameAndRootFormat;
	options.e2eTestRunner = options.e2eTestRunner ?? 'jest';

	const parsedTags = options.tags
		? options.tags.split(',').map((s) => s.trim())
		: [];
	return {
		...options,
		name: appProjectName,
		appProjectRoot,
		parsedTags,
		linter: Linter.EsLint,
	};
}
function getViteBuildConfig(options: any): TargetConfiguration {
	return {
		executor: '@nx/vite:build',
		outputs: ['{options.outputPath}'],
		defaultConfiguration: 'production',
		options: {
			outputPath: joinPathFragments(
				options.appProjectRoot,
				'dist'
			),
		},
		configurations: {
			development: {
				mode: 'development',
			},
			production: {
				mode: 'production',
			},
		},
	};
}

function getDevConfig(options: any): TargetConfiguration {
	return {
		executor: '@nx/vite:dev-server',
		defaultConfiguration: 'development',
		options: {
			buildTarget: `${options.name}:build`,
		},
		configurations: {
			development: {
				buildTarget: `${options.name}:build:development`,
				hmr: true,
			},
			production: {
				buildTarget: `${options.name}:build:production`,
				hmr: false,
			},
		},
	};
}

function addProject(tree: Tree, options: any) {
	const project: ProjectConfiguration = {
		root: options.appProjectRoot,
		sourceRoot: joinPathFragments(options.appProjectRoot, 'src'),
		projectType: 'application',
		targets: {},
		tags: options.parsedTags,
	};

	project.targets.build = getViteBuildConfig(options);

	project.targets.dev = getDevConfig(options);

	addProjectConfiguration(
		tree,
		options.name,
		project,
		options.standaloneConfig
	);
}

export async function viteGenerator(tree: Tree, schema: ViteGeneratorSchema) {
	const options = await normalizeOptions(tree, schema);
	const projectRoot = `apps/${options.name}`;
	addProject(tree, options);
	generateFiles(
		tree,
		path.join(__dirname, 'files'),
		projectRoot,
		options
	);

	await formatFiles(tree);
}

export default viteGenerator;
