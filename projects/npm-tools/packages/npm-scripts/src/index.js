/**
 * SPDX-FileCopyrightText: © 2019 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

const minimist = require('minimist');

const ProcessExitError = require('./utils/ProcessExitError');
const instrument = require('./utils/instrument');

module.exports = async function () {
	const ARGS_ARRAY = process.argv.slice(2);

	const {
		_: [type],
	} = minimist(ARGS_ARRAY);

	const PUBLIC_COMMANDS = {
		async build() {
			await require('./scripts/build')(...ARGS_ARRAY.slice(1));
		},

		async check() {
			await require('./scripts/check')();
		},

		async fix() {
			await require('./scripts/fix')();
		},

		async prettier() {
			await require('./scripts/prettier')(...ARGS_ARRAY.slice(1));
		},

		test() {
			require('./scripts/test')(ARGS_ARRAY);
		},

		theme() {
			require('./scripts/theme').run(...ARGS_ARRAY.slice(1));
		},

		async types() {
			await require('./scripts/types')(...ARGS_ARRAY.slice(1));
		},

		webpack() {
			require('./scripts/webpack')(...ARGS_ARRAY.slice(1));
		},
	};

	const PRIVATE_COMMANDS = {
		'format': async function format() {
			await require('./scripts/format')();
		},

		'format:check': async function formatCheck() {
			await require('./scripts/format')({check: true});
		},

		'lint': async function lint() {
			await require('./scripts/lint')();
		},

		'lint:fix': async function lintFix() {
			await require('./scripts/lint')({fix: true});
		},

		/**
		 * Only errors are reported. Warnings are ignored.
		 */
		'lint:quiet': async function lintQuiet() {
			await require('./scripts/lint')({quiet: true});
		},
	};

	const COMMANDS = instrument({
		...PUBLIC_COMMANDS,
		...PRIVATE_COMMANDS,
	});

	if (COMMANDS[type]) {
		try {
			await COMMANDS[type]();
		}
		catch (error) {
			if (error instanceof ProcessExitError) {
				process.exit(error.status);
			}
			else {
				throw error;
			}
		}
	}
	else {
		const commands = Object.keys(PUBLIC_COMMANDS).join(', ');

		throw new Error(
			`liferay-npm-scripts requires a valid command (${commands})`
		);
	}
};
