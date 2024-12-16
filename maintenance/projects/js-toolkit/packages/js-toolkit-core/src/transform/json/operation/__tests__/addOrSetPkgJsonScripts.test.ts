/**
 * SPDX-FileCopyrightText: © 2020 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import PkgJson from '../../../../schema/PkgJson';
import addOrSetPkgJsonScripts from '../addOrSetPkgJsonScripts';

describe('addOrSetPkgJsonScripts', () => {
	let pkgJson: PkgJson;

	beforeEach(() => {
		pkgJson = {
			name: 'a-project',
			version: '1.0.0',
		};
	});

	it('adds scripts', async () => {
		const pkgJson2 = await addOrSetPkgJsonScripts({
			build: 'webpack',
			test: 'jest',
		})(pkgJson);

		expect(pkgJson2).toStrictEqual({
			name: 'a-project',
			scripts: {
				build: 'webpack',
				test: 'jest',
			},
			version: '1.0.0',
		});
	});
});
