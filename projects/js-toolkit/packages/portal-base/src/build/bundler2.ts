/**
 * SPDX-FileCopyrightText: © 2021 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import * as babel from '@babel/core';
import babelPresetEnv from '@babel/preset-env';
import babelPresetReact from '@babel/preset-react';
import {Project, format} from '@liferay/js-toolkit-core';
import fs from 'fs';
import path from 'path';

import abort from '../util/abort';
import findFiles from '../util/findFiles';
import runSass from '../util/runSass';
import spawn from '../util/spawn';

const {info, print} = format;

export default async function bundler2(project: Project): Promise<void> {
	fs.mkdirSync(project.build.dir.asNative, {recursive: true});

	copyAssets(project);
	runSass(project);
	runCompiler(project);
	runBundler();
}

function copyAssets(project: Project): void {
	const assetFiles = findFiles(project.srcDir, (dirent) => {
		const lowerCaseName = dirent.name.toLowerCase();

		return (
			!lowerCaseName.endsWith('.js') && !lowerCaseName.endsWith('.scss')
		);
	});

	print(info`Copying ${assetFiles.length} {assets}...`);

	assetFiles.forEach((assetFile) => {
		const srcDirRelAssetFile = project.srcDir.relative(assetFile);
		const outFile = project.build.dir.join(srcDirRelAssetFile);

		try {
			fs.mkdirSync(outFile.dirname().asNative, {recursive: true});
			fs.copyFileSync(assetFile.asNative, outFile.asNative);
		}
		catch (error) {
			abort(error);
		}
	});
}

function runBabel(project: Project): void {
	const jsFiles = findFiles(project.srcDir, (dirent) =>
		dirent.name.toLowerCase().endsWith('.js')
	);

	print(info`Running {babel} on ${jsFiles.length} files...`);

	jsFiles.forEach((jsFile) => {
		const srcDirRelJsFile = project.srcDir.relative(jsFile);

		try {
			const {code, map} = babel.transformSync(
				fs.readFileSync(jsFile.asNative, 'utf8'),
				{
					filename: jsFile.asNative,
					presets: [babelPresetEnv, babelPresetReact],
					sourceMaps: true,
				}
			);

			fs.mkdirSync(
				project.build.dir.join(srcDirRelJsFile).dirname().asNative,
				{
					recursive: true,
				}
			);

			fs.writeFileSync(
				project.build.dir.join(srcDirRelJsFile).asNative,
				code,
				'utf8'
			);

			fs.writeFileSync(
				project.build.dir.join(`${srcDirRelJsFile}.map`).asNative,
				JSON.stringify(map),
				'utf8'
			);
		}
		catch (babelError) {
			abort(babelError);
		}
	});
}

function runCompiler(project: Project): void {
	runBabel(project);
}

function runBundler(): void {
	const bundlerPkgJsonPath = require.resolve(
		'liferay-npm-bundler/package.json'
	);
	const bundlerDir = path.dirname(bundlerPkgJsonPath);

	/* eslint-disable-next-line */
	const bundlerPkgJson = require(bundlerPkgJsonPath);
	const bundlerPath = path.resolve(
		bundlerDir,
		bundlerPkgJson.bin['liferay-npm-bundler']
	);

	print(info`Running {liferay-npm-bundler}...`);

	spawn('node', [bundlerPath]);
}