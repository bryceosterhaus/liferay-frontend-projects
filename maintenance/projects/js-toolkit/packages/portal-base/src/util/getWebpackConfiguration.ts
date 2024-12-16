/**
 * SPDX-FileCopyrightText: © 2021 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: LGPL-3.0-or-later
 */

import {Project, WebpackBuildOptions} from '@liferay/js-toolkit-core';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';

import findScssFiles from '../util/findScssFiles';

export default function getWebpackConfiguration(
	project: Project
): webpack.Configuration {
	const mainEntryName = project.srcDir
		.relative(project.mainModuleFile)
		.asNative.replace(/\.[^.]*$/i, '');

	const {externals, minify} = project.build.options as WebpackBuildOptions;

	const minimizer = [];

	if (minify) {
		minimizer.push(
			new TerserPlugin({
				extractComments: false,
			})
		);
	}

	const webpackConfig: webpack.Configuration = {
		entry: {
			[mainEntryName]: {
				import: project.mainModuleFile.asNative,
			},

			...getScssEntryPoints(project),
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
								require.resolve('@babel/preset-env'),
								require.resolve('@babel/preset-react'),
							],
						},
					},
				},
				{
					exclude: /node_modules/,
					test: /\.tsx?$/,
					use: {
						loader: require.resolve('ts-loader'),
					},
				},
			],
		},
		optimization: {
			minimizer,
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
			path: project.build.dir.asNative,
		},
		plugins: [new MiniCssExtractPlugin(), new RemoveEmptyScriptsPlugin()],
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
	};

	if (project.assetsDir) {
		webpackConfig.module.rules.push({
			include: project.assetsDir.asNative,
			test: /\.(sass|scss)$/,
			use: [
				MiniCssExtractPlugin.loader,
				require.resolve('css-loader'),
				{
					loader: require.resolve('sass-loader'),
					options: {
						sassOptions: {
							outputStyle: minify ? 'compressed' : 'expanded',
						},
					},
				},
			],
		});
	}

	return webpackConfig;
}

function getScssEntryPoints(project: Project): {} {
	const entryPoints = {};

	findScssFiles(project).forEach((scssFile) => {
		const entryName = project.assetsDir
			.relative(scssFile)
			.asNative.replace(/\.scss$/i, '');

		entryPoints[entryName] = {
			import: scssFile.asNative,
		};
	});

	return entryPoints;
}
