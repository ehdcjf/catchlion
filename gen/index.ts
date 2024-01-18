import prompts from 'prompts';
import { mkdirSync } from 'node:fs';
import * as path from 'path';

(async () => {
	const workspaceJson = JSON.parse(
		await Bun.file('./gen/workspace.json').text()
	);

	const viteTemplate = await Bun.file('./gen/vite.template').text();
	const htmlTemplate = await Bun.file('./gen/html.template').text();
	const appTemplate = await Bun.file('./gen/app.ts.template').text();

	const packageJson = JSON.parse(await Bun.file('./package.json').text());
	const packageWorkSpace = packageJson.workspaces;
	const packageScripts = packageJson.scripts;

	const cliResult = await prompts([
		{
			type: 'select',
			name: 'worckspace',
			message: 'Worckspace? ',
			choices: ['🎉 New!', ...packageWorkSpace].map((v) => {
				return {
					title: v.split('/')[0],
					value: v.split('/')[0],
				};
			}),
		},
		{
			type: (prev) => (prev == '🎉 New!' ? 'text' : null),
			name: 'directory',
			message: 'Directory? ',
		},
		{
			type: 'text',
			name: 'module',
			message: 'Module?',
		},
	]);

	const { worckspace, directory, module } = cliResult;

	const devCommand = `dev:${module}`;
	const buildCommand = `build:${module}`;

	if (Object.keys(packageScripts).includes(devCommand)) {
		console.error('Duplicated Module Name');
		process.exit(1);
	}

	if (worckspace === '🎉 New!') {
		if (packageWorkSpace.includes(`${directory}/*`)) {
			console.error('Duplicated Workspcae Name');
			process.exit(1);
		}
		workspaceJson[directory] = 0;
		packageWorkSpace.push(`${directory}/*`);
	}

	const dir = worckspace === '🎉 New!' ? directory : worckspace;

	const index =
		(workspaceJson[dir].toString() as string).padStart(3, '0') +
		'.';
	const modulePath = path.join(process.cwd(), dir, index + module);

	mkdirSync(path.join(modulePath, 'src'), { recursive: true });

	//app 파일 만들기
	await Bun.write(path.join(modulePath, 'src', 'app.ts'), appTemplate);

	//html 만들기
	const indexHTML = htmlTemplate.replaceAll('<%= name%>', module);
	await Bun.write(path.join(modulePath, 'index.html'), indexHTML);

	//vite 만들기
	const viteConfigJson = viteTemplate.replaceAll(
		'<%= name%>',
		`${dir}/${index + module}`
	);
	await Bun.write(
		path.join(modulePath, 'vite.config.js'),
		viteConfigJson
	);

	workspaceJson[dir]++;
	await Bun.write(
		'./gen/workspace.json',
		JSON.stringify(workspaceJson, null, 4)
	);

	packageScripts[devCommand] = `bunx --bun vite ${path.join(
		dir,
		index + module
	)}`;
	packageScripts[buildCommand] = `bunx --bun vite build ${path.join(
		dir,
		index + module
	)}`;

	packageJson.scripts = packageScripts;
	packageJson.workspaces = packageWorkSpace;
	await Bun.write('./package.json', JSON.stringify(packageJson, null, 4));
})();
