/**
 * © 2017 Liferay, Inc. <https://liferay.com>
 *
 * SPDX-License-Identifier: MIT
 */

const extractZip = require('extract-zip');
const fs = require('fs-extra');
const got = require('got');
const {
	error,
	info,
	print,
	success,
} = require('liferay-npm-build-tools-common/lib/format');
const path = require('path');
const semver = require('semver');
const stream = require('stream');
const {promisify} = require('util');
const xml2js = require('xml2js');
const Generator = require('yeoman-generator');

const Project = require('../../lib/Project');
const versions = require('../../lib/versions');

const extract = promisify(extractZip);
const pipeline = promisify(stream.pipeline);

/**
 * Generator to create a theme project extending styled, kickstarted from
 * classic.
 */
module.exports = class extends Generator {
	initializing() {
		this._project = new Project(this);
	}

	async writing() {
		const {_project} = this;
		const {liferayVersion} = _project;

		print(
			'',
			info`
			Querying https://mvnrepository.com for the latest version of Liferay
			Classic Theme compatible with ${liferayVersion}...
			`
		);

		const themeVersions = await this._getThemeVersions();

		if (themeVersions === undefined) {
			return;
		}

		const themeVersion = await this._getLatestThemeVersion(
			themeVersions,
			liferayVersion
		);

		if (themeVersion === undefined) {
			return;
		}

		print(info`
			Downloading Liferay Classic Theme ${themeVersion} and copying it to your 
			theme's source folder. 

			This may take some time...
		`);

		await this._extractThemeFiles(themeVersion);

		print(success`
			Successfully extracted Liferay Classic Theme ${themeVersion} to your 
			theme's source folder. 
		`);
	}

	async _extractThemeFiles(themeVersion) {
		const warFile = path.resolve(`classic-theme-${themeVersion}.war`);

		try {
			await pipeline(
				got.stream(
					`https://repo1.maven.org/maven2/com/liferay/plugins/classic-theme/${themeVersion}/classic-theme-${themeVersion}.war`
				),
				fs.createWriteStream(warFile)
			);

			await extract(warFile, {dir: path.resolve('src')});

			fs.unlinkSync(warFile);

			// Merge files which are both in classic and in the project we are
			// generating (because facet-theme writes them).
			await this._mergeLiferayLookAndFeelXml();
			await this._mergeLiferayPluginPackageProperties();
		} catch (err) {
			print(error`
				Error downloading and extracting Liferay Classic Theme:

				${err.message}
			`);
		}
	}

	_getLatestThemeVersion(themeVersions, liferayVersion) {
		const themeSemverExpr = versions.theme.classic[liferayVersion];

		const sortedCompatibleVersions = themeVersions
			.filter(version => semver.satisfies(version, themeSemverExpr))
			.sort((l, r) => -semver.compare(l, r));

		if (sortedCompatibleVersions === undefined) {
			print(error`
				Cannot a version of Liferay Classic Theme compatible with ${liferayVersion}
			`);
		}

		return sortedCompatibleVersions[0];
	}

	async _getThemeVersions() {
		try {
			const {body} = await got(
				'https://repo1.maven.org/maven2/com/liferay/plugins/classic-theme/maven-metadata.xml'
			);

			const mavenMetadata = await new xml2js.Parser().parseStringPromise(
				body
			);

			const themeVersions =
				mavenMetadata.metadata.versioning[0].versions[0].version;

			if (themeVersions === undefined) {
				print(error`
					Invalid XML returned from https://mvnrepository.com when 
					querying for the list of available versions of Liferay 
					Classic Theme.
				`);

				return undefined;
			}

			return themeVersions;
		} catch (err) {
			print(error`
				Error when querying https://mvnrepository.com for the list of 
				available versions of Liferay Classic Theme:

				${err.message}
			`);

			return undefined;
		}
	}

	async _mergeLiferayLookAndFeelXml() {
		// The strategy for merging this file is: use the name and id written
		// by facet-theme to substitute the ones comming from classic. The rest
		// remains the same as in classic.
		const {_project} = this;

		// Read the XML from classic
		const classicXml = await new xml2js.Parser().parseStringPromise(
			fs.readFileSync(
				path.resolve('src/WEB-INF/liferay-look-and-feel.xml')
			)
		);

		fs.unlinkSync(path.resolve('src/WEB-INF/liferay-look-and-feel.xml'));

		// Merge it into project's XML
		_project.modifyXmlFile('src/WEB-INF/liferay-look-and-feel.xml', xml => {
			const {id, name} = xml['look-and-feel']['theme'][0]['$'];

			classicXml['look-and-feel']['compatibility'][0]['version'] =
				xml['look-and-feel']['compatibility'][0]['version'];
			classicXml['look-and-feel']['theme'][0]['$'] = {
				...classicXml['look-and-feel']['theme'][0]['$'],
				id,
				name,
			};

			return classicXml;
		});
	}

	_mergeLiferayPluginPackageProperties() {
		// The strategy for merging this file is simple: use the new on that
		// facet-theme creates and remove the one coming from classic
		fs.unlinkSync(
			path.resolve('src/WEB-INF/liferay-plugin-package.properties')
		);
	}
};