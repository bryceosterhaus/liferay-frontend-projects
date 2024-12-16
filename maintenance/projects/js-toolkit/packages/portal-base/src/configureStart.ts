/**
 * SPDX-FileCopyrightText: © 2021 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import {Project} from '@liferay/js-toolkit-core';

import promptForConfiguration from './util/promptForConfiguration';
import runConfigureWizard from './util/runConfigureWizard';
import {ensureProjectIsStartable} from './util/startableProjectTypes';

export default async function configureStart(): Promise<void> {
	const project = new Project('.');

	ensureProjectIsStartable(project);

	await runConfigureWizard('start', async () => {
		const {port} = await promptForConfiguration([
			{
				default: project.start.port,
				message:
					'What port should be used for the live development server?',
				name: 'port',
				type: 'input',
			},
		]);

		if (port !== undefined) {
			project.start.storePort(port as number);
		}
	});
}
