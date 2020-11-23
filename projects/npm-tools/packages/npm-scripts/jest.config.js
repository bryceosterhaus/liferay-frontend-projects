/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

module.exports = {
	setupFilesAfterEnv: ['<rootDir>/support/jest/matchers.js'],
	testEnvironment: 'node',
	testMatch: ['**/test/**/*.js'],
};
