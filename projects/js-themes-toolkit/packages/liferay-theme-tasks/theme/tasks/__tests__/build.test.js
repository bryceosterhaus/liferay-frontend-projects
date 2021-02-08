/**
 * @jest-environment node
 */

/**
 * SPDX-FileCopyrightText: © 2017 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: MIT
 */

const fs = require('fs-extra');
const {Gulp} = require('gulp');
const path = require('path');
const {parseString} = require('xml2js');

const project = require('../../../lib/project');
const {
	cleanTempTheme,
	setupTempTheme,
	stripNewlines,
} = require('../../../lib/test/util');
const {registerTasks} = require('../../index');

function assertEqual(actual, expected) {
	if (Array.isArray(expected) && Array.isArray(actual)) {
		if (
			expected.length === actual.length &&
			expected.every((item, index) => {
				item = actual[index];

				return item;
			})
		) {
			return;
		}
	}
	if (expected !== actual) {
		fail(
			`Expected\n\n${description(expected)}\n\nto equal\n\n${description(
				actual
			)}`
		);
	}
}

function assertExists(file) {
	if (!fs.existsSync(file)) {
		fail(`Expected file does not exist at: ${file}`);
	}
}

assertExists.not = (file) => {
	if (fs.existsSync(file)) {
		fail(`Expected file to not exist at: ${file}`);
	}
};

function assertMatches(string, regExp) {
	if (!regExp.test(string)) {
		fail(`Expected string to match ${regExp}\n\n${string}`);
	}
}

function assertTruthy(condition) {
	if (!condition) {
		fail(`Expected truthy condition but got ${condition}`);
	}
}

function description(value) {
	try {
		return JSON.stringify(value);
	}
	catch {
		return `[unstringifiable value: ${value}]`;
	}
}

function fail(message) {
	console.error(message);

	throw new Error(message);
}

beforeAll(() => {
	process.env.LIFERAY_THEME_STYLED_PATH = path.dirname(
		require.resolve('liferay-frontend-theme-styled/package.json')
	);
	process.env.LIFERAY_THEME_UNSTYLED_PATH = path.dirname(
		require.resolve('liferay-frontend-theme-unstyled/package.json')
	);
});

afterAll(() => {
	delete process.env.LIFERAY_THEME_STYLED_PATH;
	delete process.env.LIFERAY_THEME_UNSTYLED_PATH;
});

describe('using lib_sass', () => {
	let buildPath;
	let tempTheme;

	afterEach(() => {
		cleanTempTheme(tempTheme);
	});

	beforeEach(() => {
		buildPath = undefined;
		tempTheme = undefined;
	});

	it('build task should correctly compile theme', (done) => {
		let sassOptionsCalled = false;

		tempTheme = setupTempTheme({
			init: () =>
				registerTasks({
					distName: 'base-theme',
					gulp: new Gulp(),
					hookFn: buildHookFn,
					sassOptions: (defaults) => {
						sassOptionsCalled = true;

						assertTruthy(defaults.includePaths);

						return defaults;
					},
				}),
			namespace: 'lib_sass_build_task',
			themeConfig: {},
			themeName: 'base-theme-7-2',
			version: '7.2',
		});

		buildPath = path.join(
			tempTheme.tempPath,
			project.options.pathBuild.asNative
		);

		project.gulp.runSequence('build', () => {
			assertTruthy(sassOptionsCalled);

			done();
		});
	});

	it('build task should correctly compile theme with dart-sass', (done) => {
		const initialTimeout = jest.setTimeout.Timeout;

		jest.setTimeout.Timeout = 50000;

		tempTheme = setupTempTheme({
			init: () =>
				registerTasks({
					distName: 'base-theme',
					gulp: new Gulp(),
					hookFn: buildHookFn,
					sassOptions: {dartSass: true},
				}),
			namespace: 'dart_sass_build_task',
			themeConfig: {},
			themeName: 'base-theme-7-2',
			version: '7.2',
		});

		buildPath = path.join(
			tempTheme.tempPath,
			project.options.pathBuild.asNative
		);

		project.gulp.runSequence('build', () => {
			jest.setTimeout.Timeout = initialTimeout;

			done();
		});
	});

	function buildHookFn(gulp) {
		gulp.hook('after:build:base', _assertBase);
		gulp.hook('after:build:clean', _assertClean);
		gulp.hook('after:build:compile-css', _assertCompileCss);
		gulp.hook('after:build:hook', _assertHook);
		gulp.hook('after:build:fix-at-directives', _assertFixAtDirectives);
		gulp.hook('after:build:move-compiled-css', _assertMoveCompiledCss);
		gulp.hook('after:build:remove-old-css-dir', _assertRemoveOldCssDir);
		gulp.hook('after:build:rename-css-dir', _assertRenameCssDir);
		gulp.hook('after:build:src', _assertSrc);
		gulp.hook('after:build:themelets', _assertThemelets);
		gulp.hook('after:build:web-inf', _assertWebInf);
		gulp.hook('after:plugin:war', _assertWar);
		gulp.hook('before:build', _assertBeforeBuild);
	}

	function _assertBase(cb) {
		assertExists(buildPath);

		cb();
	}

	function _assertBeforeBuild(cb) {
		const distPath = path.join(tempTheme.tempPath, 'dist');
		const customSrcPath = path.join(tempTheme.tempPath, 'src');

		assertExists(customSrcPath);
		assertExists.not(buildPath);
		assertExists.not(distPath);

		cb();
	}

	function _assertClean(cb) {
		assertExists.not(buildPath);

		cb();
	}

	function _assertCompileCss(cb) {
		cb();
	}

	function _assertHook(cb) {
		const hookPath = path.join(buildPath, 'WEB-INF', 'liferay-hook.xml');

		assertExists(hookPath);

		const liferayHookXML = fs.readFileSync(hookPath, {
			encoding: 'utf8',
		});

		parseString(liferayHookXML, (err, result) => {
			if (err) {
				throw err;
			}

			assertEqual(result.hook['language-properties'], [
				'content/Language_en.properties',
				'content/Language_es.properties',
			]);

			cb();
		});
	}

	function _assertFixAtDirectives(cb) {
		const cssPath = path.join(buildPath, 'css');
		const mainCssPath = path.join(cssPath, 'main.css');

		assertExists(cssPath);
		assertMatches(
			fs.readFileSync(mainCssPath, 'utf8'),
			/@import\surl\(file\.css\?t=[0-9]+\);/
		);

		cb();
	}

	function _assertMoveCompiledCss(cb) {
		const cssPath = path.join(buildPath, 'css');

		assertExists(cssPath);

		cb();
	}

	function _assertRemoveOldCssDir(cb) {
		const cssPath = path.join(buildPath, '_css');

		assertExists.not(cssPath);

		cb();
	}

	function _assertRenameCssDir(cb) {
		const _cssPath = path.join(buildPath, '_css');

		assertExists(_cssPath);

		cb();
	}

	function _assertSrc(cb) {
		const cssPath = path.join(buildPath, 'css');
		const jsPath = path.join(buildPath, 'js');
		const templatesPath = path.join(buildPath, 'templates');
		const imagesPath = path.join(buildPath, 'images');
		const webInfPath = path.join(buildPath, 'WEB-INF');

		assertExists(cssPath);
		assertExists(jsPath);
		assertExists(imagesPath);
		assertExists(webInfPath);
		assertExists(templatesPath);

		const customCSSFileName = '_custom.scss';
		const customCSSPath = path.join(cssPath, customCSSFileName);

		const fileContent = stripNewlines(
			fs.readFileSync(customCSSPath, {
				encoding: 'utf8',
			})
		);

		assertTruthy(
			fileContent.indexOf(
				'/* inject:imports *//* endinject *//* ' +
					customCSSFileName +
					' */'
			) > -1
		);

		const mainJsPath = path.join(jsPath, 'main.js');

		assertMatches(
			fs.readFileSync(mainJsPath, 'utf8'),
			/console\.log\('main\.js'\)/
		);

		const baseTextScssPath = path.join(cssPath, 'base', '_text.scss');

		assertExists(baseTextScssPath);

		const templateLanguage = project.themeConfig.config.templateLanguage;

		const initPath = path.join(templatesPath, 'init.' + templateLanguage);
		const initCustomPath = path.join(
			templatesPath,
			'init_custom.' + templateLanguage
		);
		const navigationPath = path.join(
			templatesPath,
			'navigation.' + templateLanguage
		);
		const portalNormalPath = path.join(
			templatesPath,
			'portal_normal.' + templateLanguage
		);
		const portalPopUpPath = path.join(
			templatesPath,
			'portal_pop_up.' + templateLanguage
		);
		const portletPath = path.join(
			templatesPath,
			'portlet.' + templateLanguage
		);

		assertExists(initPath);
		assertExists(initCustomPath);
		assertExists(navigationPath);
		assertExists(portalNormalPath);
		assertExists(portalPopUpPath);
		assertExists(portletPath);

		assertMatches(fs.readFileSync(portalNormalPath, 'utf8'), /BASE_THEME/);

		cb();
	}

	function _assertThemelets(cb) {
		const customScssPath = path.join(
			buildPath,
			'themelets',
			'test-themelet',
			'css',
			'_custom.scss'
		);
		const iconPngPath = path.join(
			buildPath,
			'themelets',
			'test-themelet',
			'images',
			'icon.png'
		);
		const mainJsPath = path.join(
			buildPath,
			'themelets',
			'test-themelet',
			'js',
			'main.js'
		);
		const freemarkerPath = path.join(
			buildPath,
			'themelets',
			'test-themelet',
			'templates',
			'freemarker.ftl'
		);
		const velocityPath = path.join(
			buildPath,
			'themelets',
			'test-themelet',
			'templates',
			'velocity.vm'
		);

		assertExists(customScssPath);
		assertExists(iconPngPath);
		assertExists(mainJsPath);
		assertExists(freemarkerPath);
		assertExists(velocityPath);

		const customCSSFileName = '_custom.scss';
		const customCSSPath = path.join(buildPath, 'css', customCSSFileName);

		assertMatches(
			fs.readFileSync(customCSSPath, 'utf8'),
			/@import "\.\.\/themelets\/test-themelet\/css\/_custom\.scss";/
		);

		// TODO: add inject tags to themes when in development

		const portalNormalPath = path.join(
			buildPath,
			'templates',
			'portal_normal.ftl'
		);

		assertMatches(
			fs.readFileSync(portalNormalPath, 'utf8'),
			/<script src="\${theme_display\.getPathThemeRoot\(\)}\/themelets\/test-themelet\/js\/main\.js"><\/script>/
		);

		cb();
	}

	function _assertWar(cb) {
		const warPath = path.join(tempTheme.tempPath, 'dist', 'base-theme.war');

		assertExists(warPath);

		cb();
	}

	function _assertWebInf(cb) {
		const webInfPath = path.join(buildPath, 'WEB-INF');
		const pluginPackagePath = path.join(
			webInfPath,
			'liferay-plugin-package.properties'
		);

		assertExists(webInfPath);
		assertExists(pluginPackagePath);

		cb();
	}
});
