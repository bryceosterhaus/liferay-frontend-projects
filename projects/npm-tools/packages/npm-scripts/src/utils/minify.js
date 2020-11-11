/**
 * SPDX-FileCopyrightText: © 2019 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

const fs = require('fs');
const path = require('path');
const {minify: terser} = require('terser');

const getMergedConfig = require('./getMergedConfig');
const getPaths = require('./getPaths');

const BUILD_CONFIG = getMergedConfig('npmscripts', 'build');

const MINIFIER_CONFIG = getMergedConfig('terser');

const MINIFY_GLOBS = [
	path.posix.join(BUILD_CONFIG.output, '**', '*.js'),
	'!*-min.js',
	'!*.min.js',
];

async function minify() {
	const start = Date.now();

	const paths = getPaths(MINIFY_GLOBS, [], '', {useDefaultIgnores: false});

	let successes = 0;
	let errors = 0;
	let before = 0;
	let after = 0;

	for (const path of paths) {
		const contents = fs.readFileSync(path, 'utf8');
		before += contents.length;

		try {
			const result = await terser(contents, MINIFIER_CONFIG);

			if (result.code !== contents) {
				console.log(
					`${contents.length} -> ${result.code.length}: ${path}`
				);

				// Write to disk here.

			}
			else {
				console.log(`UNCHANGED (${contents.length}): ${path}`);
			}

			after += result.code.length;
			successes++;
		}
		catch (error) {
			console.log(`[ignored: ${error}]: ${path}`);

			errors++;
		}
	}

	console.log('Summary:');
	console.log(`  Files minified:    ${successes}`);
	console.log(`  Files with errors: ${errors}`);
	console.log(`  Before size:       ${before}`);
	console.log(`  After size:        ${after}`);
	console.log(`  Delta:             ${before - after}`);
	console.log(
		`  Elapsed:           ${((Date.now() - start) / 1000).toFixed(2)}`
	);
}

module.exports = minify;
