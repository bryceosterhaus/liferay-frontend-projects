/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

/* eslint-disable no-console */

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const {liferayCliPath, liferayDir, testDir, tmpDir} = require('./resources');

function build(projectDirName) {
	withNodeEnv('production', () => {
		runScript(projectDirName, 'build');
	});
}

function deploy(projectDirName) {
	withNodeEnv('production', () => {
		runScript(projectDirName, 'deploy');
	});
}

function generateAngularCli(projectDirName) {
	logStep(`GENERATE: ${projectDirName}`);

	zapProjectDir(projectDirName);

	spawn(
		'npx',
		[
			'@angular/cli@12.2.10',
			'new',
			projectDirName,
			'--defaults',
			'--skip-git',
			'--skip-install',
			'--directory',
			projectDirName,
		],
		{
			cwd: testDir,
		}
	);

	const projectDir = path.join(testDir, projectDirName);

	runLiferayCli(projectDir, ['adapt'], {});

	writeLiferayJsonFile(projectDirName);
}

function generateCreateReactApp(projectDirName) {
	logStep(`GENERATE: ${projectDirName}`);

	zapProjectDir(projectDirName);

	spawn('npx', ['create-react-app@^5.0.0', projectDirName], {
		cwd: testDir,
	});

	const projectDir = path.join(testDir, projectDirName);

	runLiferayCli(projectDir, ['adapt'], {});

	writeLiferayJsonFile(projectDirName);

	fs.writeFileSync(
		path.join(projectDir, '.env'),
		'SKIP_PREFLIGHT_CHECK=true',
		'utf8'
	);
}

function generatePortlet(projectDirName, platform, projectType) {
	logStep(`GENERATE: ${projectDirName}`);

	zapProjectDir(projectDirName);

	runLiferayCli(testDir, ['new', projectDirName], {
		platform,
		projectType,
		target: 'Liferay Platform Project',
	});

	writeLiferayJsonFile(projectDirName);
}

function generateRemoteApp(projectDirName, platform) {
	logStep(`GENERATE: ${projectDirName}`);

	zapProjectDir(projectDirName);

	runLiferayCli(testDir, ['new', projectDirName], {
		platform,
		target: 'Liferay Remote App Project',
	});

	writeLiferayJsonFile(projectDirName);
}

function generateVueCli(projectDirName) {
	logStep(`GENERATE: ${projectDirName}`);

	zapProjectDir(projectDirName);

	spawn(
		'npx',
		['@vue/cli@4.5.14', 'create', projectDirName, '-d', '-n', '-m', 'yarn'],
		{
			cwd: testDir,
		}
	);

	const projectDir = path.join(testDir, projectDirName);

	runLiferayCli(projectDir, ['adapt'], {});

	writeLiferayJsonFile(projectDirName);
}

function logStep(step) {
	console.log(`
********************************************************************************
* ${step}
********************************************************************************
`);
}

function runLiferayCli(dir, args, options) {
	const optionsFilePath = path.join(tmpDir, 'options.json');

	fs.writeFileSync(optionsFilePath, JSON.stringify(options));

	const argv = [
		liferayCliPath,
		...args,
		'--batch',
		'--options',
		optionsFilePath,
	];

	spawn('node', argv, {
		cwd: dir,
	});
}

function runScript(projectDirName, baseScriptName) {
	const projectDir = path.join(testDir, projectDirName);

	const pkgJson = JSON.parse(
		fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8')
	);

	const {scripts} = pkgJson;

	if (!scripts) {
		return;
	}

	let script;

	if (scripts[`${baseScriptName}:liferay`]) {
		script = `${baseScriptName}:liferay`;
	}
	else if (scripts[baseScriptName]) {
		script = baseScriptName;
	}

	if (!script) {
		return;
	}

	logStep(`${baseScriptName.toUpperCase()}: ${projectDirName}`);

	withNodeEnv('development', () => {
		spawn('yarn', [], {
			cwd: projectDir,
		});
	});

	console.log(projectDir, script);

	spawn('yarn', [script], {
		cwd: projectDir,
	});
}

function spawn(cmd, args, options = {}) {
	const proc = childProcess.spawnSync(cmd, args, {
		cwd: path.join('..', '..'),
		shell: true,
		stdio: 'inherit',
		...options,
	});

	if (proc.error || proc.status !== 0) {
		process.exit(1);
	}
}

function withNodeEnv(nodeEnv, callback) {
	const oldNODE_ENV = process.env.NODE_ENV;

	try {
		process.env.NODE_ENV = nodeEnv;
		callback();
	}
	finally {
		process.env.NODE_ENV = oldNODE_ENV;
	}
}

function writeLiferayJsonFile(projectDirName) {
	fs.writeFileSync(
		path.join(testDir, projectDirName, '.liferay.json'),
		JSON.stringify({
			deploy: {
				path: liferayDir,
			},
		})
	);
}

function zapProjectDir(projectDirName) {
	const rmdirSync = fs.rmSync || fs.rmdirSync;

	try {
		rmdirSync(path.join(testDir, projectDirName), {recursive: true});
	}
	catch (error) {
		if (error.code !== 'ENOENT') {
			throw error;
		}
	}
}

module.exports = {
	build,
	deploy,
	generateAngularCli,
	generateCreateReactApp,
	generatePortlet,
	generateRemoteApp,
	generateVueCli,
	logStep,
	spawn,
	withNodeEnv,
};
