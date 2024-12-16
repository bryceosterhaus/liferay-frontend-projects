/**
 * SPDX-FileCopyrightText: © 2021 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import {Project, format} from '@liferay/js-toolkit-core';
import fs from 'fs';

import abort from '../util/abort';
import bundler2 from './bundler2';
import customElement from './customElement';

const {print, success} = format;

export default async function build(): Promise<void> {
	const project = new Project('.');

	fs.mkdirSync(project.build.dir.asNative, {recursive: true});

	try {
		switch (project.build.type) {
			case 'customElement':
				await customElement(project);
				break;

			case 'bundler2':
				await bundler2(project);
				break;

			default:
				abort(`Unknown project build type: ${project.build.type}`);
				break;
		}

		print(success`{Project successfully built}`);
	}
	catch (error) {
		abort(`Build failed!\n${error.stack}`);
	}
}
