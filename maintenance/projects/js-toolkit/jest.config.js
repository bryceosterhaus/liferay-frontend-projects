/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

module.exports = {
	modulePathIgnorePatterns: [
		'lib/.*',
		'generators/.*',
		'qa/.*',
		'__fixtures__/.*',
	],
	testPathIgnorePatterns: ['/node_modules/', '/__fixtures__/'],
	transform: {
		'\\.ts$': 'ts-jest',
	},
};
