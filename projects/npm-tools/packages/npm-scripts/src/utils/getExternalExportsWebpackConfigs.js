/**
 * SPDX-FileCopyrightText: © 2019 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

/* eslint-disable @liferay/no-dynamic-require */

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const resolve = require('resolve');
const TerserPlugin = require('terser-webpack-plugin');

const convertImportsToExternals = require('./convertImportsToExternals');
const createTempFile = require('./createTempFile');

module.exports = function getExternalExportsWebpackConfigs(
	projectDir,
	buildConfig
) {
	const {exports, imports} = buildConfig;

	const allExternals = convertImportsToExternals(imports, 3);

	return exports
		.filter((exportsItem) => !exportsItem.path.startsWith('.'))
		.reduce((webpackConfigs, exportsItem) => {
			const importPath = getEntryImportPath(exportsItem);

			const externals = {
				...allExternals,
			};

			delete externals[exportsItem.path];

			const webpackConfig = {
				entry: {
					[exportsItem.name]: {
						import: importPath,
					},
				},
				experiments: {
					outputModule: true,
				},
				externals,
				externalsType: 'module',
				module: {
					rules: [
						{
							exclude: /node_modules/,
							test: /\.js$/,
							use: {
								loader: require.resolve('babel-loader'),
								options: {
									presets: [
										[
											require.resolve(
												'@babel/preset-env'
											),
											{
												modules: 'auto',
												targets:
													'Chrome 110, last 2 Safari version, last 2 Chrome version, last 2 ChromeAndroid version, last 2 Edge version, last 2 Firefox version, last 2 iOS version',
											},
										],
										require.resolve('@babel/preset-react'),
									],
								},
							},
						},
					],
				},
				output: {
					environment: {
						dynamicImport: true,
						module: true,
					},
					filename: '[name].js',
					library: {
						type: 'module',
					},
					path: path.resolve(buildConfig.output),
				},
				plugins: [new MiniCssExtractPlugin()],
				resolve: {
					fallback: {
						path: false,
					},
				},
			};

			if (process.env.NODE_ENV === 'development') {
				webpackConfig.devtool = 'source-map';
				webpackConfig.mode = 'development';
			}
			else {
				webpackConfig.devtool = false;
				webpackConfig.mode = 'production';
				webpackConfig.optimization = {
					...webpackConfig.optimization,
					minimize: true,
					minimizer: [
						new TerserPlugin({
							terserOptions: {
								keep_classnames: true,
								keep_fnames: true,
							},
						}),
					],
				};
			}

			// For CSS exports, add our loader so that the .js stub is created

			if (importPath.endsWith('.css')) {
				webpackConfig.module.rules.push({
					include: /node_modules/,
					test: (filePath) =>
						new RegExp(`${importPath.replace('/', '\\/')}$`).test(
							filePath.split(path.sep).join(path.posix.sep)
						),
					use: [
						{
							loader: require.resolve('./webpackExportCssLoader'),
							options: {
								filename:
									exportsItem.name.replace(
										'/css/',
										'/exports/'
									) + '.css',
								projectDir,
								url: exportsItem.name + '.css',
							},
						},
						{
							loader: MiniCssExtractPlugin.loader,
						},
						{
							loader: require.resolve('css-loader'),
						},
					],
				});
			}

			// For SVG exports, add our loader so that the .js stub is created

			if (importPath.endsWith('.svg')) {
				webpackConfig.devtool = false;

				webpackConfig.module.rules.push({
					include: /node_modules/,
					test: (filePath) =>
						new RegExp(`${importPath.replace('/', '\\/')}$`).test(
							filePath.split(path.sep).join(path.posix.sep)
						),
					use: [
						{
							loader: require.resolve('./webpackExportSvgLoader'),
						},
					],
				});
			}

			if (buildConfig.report) {
				createTempFile(
					`${exportsItem.name}.webpack.config.json`,
					JSON.stringify(webpackConfig, null, 2),
					{autoDelete: false}
				);
			}

			webpackConfigs.push(webpackConfig);

			return webpackConfigs;
		}, []);
};

function getEntryImportPath(exportsItem) {
	let importPath;

	if (exportsItem.symbols === undefined) {
		importPath = exportsItem.path;
	}
	else {
		let module;

		if (exportsItem.symbols === 'auto') {
			try {
				module = require(resolve.sync(exportsItem.path, {
					basedir: '.',
				}));
			}
			catch (error) {
				console.error('');
				console.error(
					`Unable to require('${exportsItem.path}'): please consider`,
					`specifying the exported symbols explicitly in your`,
					`'npmscripts.config.js' file.`
				);
				console.error('');
				console.error(error);

				process.exit(1);
			}
		}
		else {
			module = exportsItem.symbols.reduce((module, symbol) => {
				module[symbol] = true;

				return module;
			}, {});

			if (exportsItem.format === 'esm') {
				module.__esModule = true;
			}
		}

		const nonDefaultFields = Object.keys(module)
			.filter((field) => field !== 'default')
			.map((field) => `	${field}`)
			.join(',\n');

		let bridgeSource;

		//
		// If the exported object was generated by a harmony aware tool, we
		// directly export the fields as is.
		//
		// Otherwise, we need to set default to the exported object so that
		// other modules can find it when they are interoperated by tools like
		// babel or webpack.
		//

		if (module.__esModule) {
			bridgeSource = `
const x = require('${exportsItem.path}');

const {
	default: def,
${nonDefaultFields}
} = x;

export {
	def as default,
${nonDefaultFields}
};
`;
		}
		else {
			bridgeSource = `
const x = require('${exportsItem.path}');

const {
${nonDefaultFields}
} = x;

const __esModule = true;

export {
	__esModule,
	x as default,
${nonDefaultFields}
};
`;
		}

		const {filePath} = createTempFile(
			`${exportsItem.path}.js`,
			bridgeSource,
			{
				autoDelete: false,
			}
		);

		importPath = filePath;
	}

	return importPath;
}
