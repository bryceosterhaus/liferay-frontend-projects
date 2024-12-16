/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: MIT
 */

module.exports = {
	modulePathIgnorePatterns: ['<rootDir>/maintenance/', '__fixtures__/.*'],
	projects: [
		// Projects which require special configuration.

		'maintenance/projects/js-themes-toolkit/jest.config.js',
		'maintenance/projects/js-toolkit/jest.config.js',
		'projects/eslint-plugin/jest.config.js',
		'projects/npm-tools/packages/npm-scripts/jest.config.js',

		// Everything else.
		//
		// Note the trickiness here: the next project is "recursive";
		// when Jest looks at it, it will use the `testMatch` (etc)
		// below and ignore the `projects` listing.

		'jest.config.js',
	],
	testMatch: ['**/test/**/*.js'],
	testPathIgnorePatterns: [
		// Projects in maintenance mode which do not participate in the
		// top-level set of Yarn workspaces.

		'<rootDir>/maintenance',

		// Any project which had special configuration above should be
		// ignored here.

		'<rootDir>/projects/eslint-plugin',
		'<rootDir>/projects/npm-tools/packages/npm-scripts',
		'<rootDir>/projects/prettier-plugin',

		// Third-party.

		'<rootDir>/third-party/projects',

		// Standard ignores.

		'/node_modules/',
	],
};
