/**
 *
 */
export default class Config {
	/**
	 * Creates an instance of Configuration class
	 * @constructor
	 * @param {object=} cfg configuration properties
	 */
	constructor(cfg) {
		this._modules = {};
		this._maps = {};
		this._paths = {};

		this._config = {maps: {}, paths: {}};
		this._parse(cfg, 'explainResolutions', false);
		this._parse(cfg, 'waitTimeout', 7000);
		this._parse(cfg, 'basePath', '');
		this._parse(cfg, 'combine', false);
		this._parse(cfg, 'url', '');
		this._parse(cfg, 'urlMaxLength', 2000);
	}

	/**
	 * Whether or not to explain how require() calls are resolved
	 */
	get explainResolutions() {
		return this._config.explainResolutions;
	}

	/**
	 * Time to wait for module script requests to load (in milliseconds)
	 */
	get waitTimeout() {
		return this._config.waitTimeout;
	}

	/**
	 * The base path from where modules must be retrieved
	 */
	get basePath() {
		return this._config.basePath;
	}

	/**
	 * Whether or not to combine module requests into combo URLs
	 */
	get combine() {
		return this._config.combine;
	}

	/**
	 * The URL of the server
	 */
	get url() {
		return this._config.url;
	}

	/**
	 * The maximum length of a combo URL. If URL is larger than that it is split
	 * in as many requests as needed.
	 */
	get urlMaxLength() {
		return this._config.urlMaxLength;
	}

	/**
	 * Default parameters to add to the module request URLs
	 */
	get defaultURLParams() {
		return this._config.defaultURLParams;
	}

	/**
	 * An object with registered module paths
	 */
	get paths() {
		return this._paths;
	}

	/**
	 * Adds a module to the configuration with default field values if it
	 * doesn't exist. Otherwise, returns the module.
	 * @param {string} moduleName
	 * @return {Object} the module
	 */
	addModule(moduleName) {
		let module = this._modules[moduleName];

		if (!module) {
			this._modules[moduleName] = module = new Module(moduleName);
		}

		return module;
	}

	/**
	 * Add mappings to the current configuration
	 * @param {object} mappings an object with one or more mappings
	 */
	addMappings(mappings) {
		Object.assign(this._maps, mappings);
	}

	/**
	 * Add path mappings to the current configuration
	 * @param {object} paths an object with one or more path mappings
	 */
	addPaths(paths) {
		Object.assign(this._paths, paths);
	}

	/**
	 * Returns map with all registered modules or the requested subset of them.
	 * @param {?Array} moduleNames optional list of module names to retrieve
	 * @return {Array}
	 */
	getModules(moduleNames) {
		if (moduleNames) {
			return moduleNames.map(moduleName => this.getModule(moduleName));
		} else {
			return this._modules;
		}
	}

	/**
	 * Returns the registered module for the moduleName. If not found it maps
	 * the module name and return the registeredModule for the mapped name.
	 * @param {string} moduleName the module name
	 * @param {?object} contextMap contextual module mapping information
	 *     relevant to the current load operation
	 * @return {Object} the registed module object
	 */
	getModule(moduleName, contextMap) {
		let module = this._modules[moduleName];

		if (!module) {
			const mappedName = this.mapModule(moduleName, contextMap);

			module = this._modules[mappedName];
		}

		return module;
	}

	/**
	 * Map a list of module names at once
	 * @param {Array} moduleNames module names to map
	 * @return {Array} mapped module names
	 */
	mapModules(moduleNames) {
		return moduleNames.map(moduleName => this.mapModule(moduleName));
	}

	/**
	 * Maps module names to their aliases. Example:
	 * __CONFIG__.maps = {
	 *      liferay: 'liferay@1.0.0'
	 * }
	 *
	 * When someone does require('liferay/html/js/ac.es',...),
	 * if the module 'liferay/html/js/ac.es' is not defined,
	 * then a corresponding alias will be searched. If found, the name will be
	 * replaced, so it will look like user did
	 * require('liferay@1.0.0/html/js/ac.es',...).
	 *
	 * Additionally, modules can define a custom map to alias module names just
	 * in the context of that module loading operation. When present, the
	 * contextual module mapping will take precedence over the general one.
	 *
	 * @protected
	 * @param {string} moduleName The module which have to be mapped
	 * @param {?object} contextMap Contextual module mapping information
	 *     relevant to the current load operation
	 * @return {array} The mapped module
	 */
	mapModule(moduleName, contextMap) {
		if (contextMap) {
			moduleName = this._mapMatches(moduleName, contextMap);
		}

		if (Object.keys(this._maps).length > 0) {
			moduleName = this._mapMatches(moduleName, this._maps);
		}

		return moduleName;
	}

	/**
	 * Parse a configuration property to store it in _config.
	 * @param {object} cfg
	 * @param {string} property
	 * @param {*} defaultValue
	 */
	_parse(cfg, property, defaultValue) {
		this._config[property] = cfg.hasOwnProperty(property)
			? cfg[property]
			: defaultValue;
	}

	/**
	 * Creates a function that transforms module names based on a provided
	 * set of mappings.
	 *
	 * @protected
	 * @param {string} moduleName module name
	 * @param {object} maps Mapping information.
	 * @return {function} The generated mapper function
	 */
	_mapMatches(moduleName, maps) {
		let match = maps[moduleName];

		if (match) {
			if (typeof match === 'object') {
				return match.value;
			}

			return match;
		}

		match = this._mapExactMatch(moduleName, maps);

		// Apply partial mapping only if exactMatch hasn't been
		// already applied for this mapping
		if (!match) {
			match = this._mapPartialMatch(moduleName, maps);
		}

		// Apply * mapping only if neither exactMatch nor
		// partialMatch have been already applied for this mapping
		if (!match) {
			match = this._mapWildcardMatch(moduleName, maps);
		}

		return match || moduleName;
	}

	/**
	 * Transforms a module name using the exactMatch mappings
	 * in a provided mapping object.
	 *
	 * @protected
	 * @param {string} module The module which have to be mapped.
	 * @param {object} maps Mapping information.
	 * @return {object} An object with a boolean `matched` field and a string
	 *     `result` field containing the mapped module name
	 */
	_mapExactMatch(module, maps) {
		for (let alias in maps) {
			/* istanbul ignore else */
			if (Object.prototype.hasOwnProperty.call(maps, alias)) {
				const aliasValue = maps[alias];

				if (aliasValue.value && aliasValue.exactMatch) {
					if (module === alias) {
						return aliasValue.value;
					}
				}
			}
		}
	}

	/**
	 * Transforms a module name using the partial mappings
	 * in a provided mapping object.
	 *
	 * @protected
	 * @param {string} module The module which have to be mapped.
	 * @param {object} maps Mapping information.
	 * @return {object} An object with a boolean `matched` field and a string
	 *     `result` field containing the mapped module name
	 */
	_mapPartialMatch(module, maps) {
		for (let alias in maps) {
			/* istanbul ignore else */
			if (Object.prototype.hasOwnProperty.call(maps, alias)) {
				let aliasValue = maps[alias];

				if (!aliasValue.exactMatch) {
					if (aliasValue.value) {
						aliasValue = aliasValue.value;
					}

					if (module === alias || module.indexOf(alias + '/') === 0) {
						return aliasValue + module.substring(alias.length);
					}
				}
			}
		}
	}

	/**
	 * Transforms a module name using the wildcard mapping in a provided mapping
	 * object.
	 *
	 * @protected
	 * @param {string} module The module which have to be mapped.
	 * @param {object} maps Mapping information.
	 * @return {object} An object with a boolean `matched` field and a string
	 *     `result` field containing the mapped module name
	 */
	_mapWildcardMatch(module, maps) {
		if (typeof maps['*'] === 'function') {
			return maps['*'](module);
		}
	}
}

/**
 *
 */
class Module {
	/**
	 * @param {string} name name of module
	 */
	constructor(name) {
		this._name = name;
		this._factory = undefined;
		this._implementation = undefined;
		this._fetched = false;
		this._defined = false;
		this._implemented = false;
	}

	/**
	 * Name of module
	 */
	get name() {
		return this._name;
	}

	/**
	 * AMD factory function
	 */
	get factory() {
		return this._factory;
	}

	/**
	 * Result of factory invocation (module.exports)
	 */
	get implementation() {
		return this._implementation;
	}

	/**
	 * Fetched (retrieved from server) flag. It is set to true when the <script>
	 * containing the module definition has been loaded.
	 *
	 * Note that a module may be defined even if it is not yet fetched because
	 * define() gets called while the script is being loaded.
	 */
	get fetched() {
		return this._fetched;
	}

	/**
	 * Defined is set to true when the module has been registered through the
	 * AMD define() call.
	 *
	 * Note that definition does not imply implementation.
	 */
	get defined() {
		return this._defined;
	}

	/**
	 * Implemented is set to true when the module has been defined and its
	 * AMD factory function has been invoked successfully.
	 */
	get implemented() {
		return this._implemented;
	}

	/**
	 * Name of module
	 * @param {string} name
	 */
	set name(name) {
		throw new Error(`Name of module ${this.name} is read-only`);
	}

	/**
	 * AMD factory function
	 * @param {function} factory
	 */
	set factory(factory) {
		if (this._factory) {
			throw new Error(`Factory of module ${this.name} already set`);
		}

		this._factory = factory;
	}

	/**
	 * Result of factory invocation (module.exports)
	 * @param {*} implementation
	 */
	set implementation(implementation) {
		if (this._implementation) {
			throw new Error(
				`Implementation of module ${this.name} already set`
			);
		}

		this._implementation = implementation;
	}

	/**
	 * Fetched flag. See getter for description.
	 * @param {boolean} fetched
	 */
	set fetched(fetched) {
		if (this._fetched) {
			throw new Error(`Fetched flag of module ${this.name} already set`);
		}

		this._fetched = fetched;
	}

	/**
	 * Defined flag. See getter for description.
	 * @param {boolean} defined
	 */
	set defined(defined) {
		if (this._defined) {
			throw new Error(`Defined flag of module ${this.name} already set`);
		}

		this._defined = defined;
	}

	/**
	 * Implemented flag. See getter for description.
	 * @param {boolean} implemented
	 */
	set implemented(implemented) {
		if (this._implemented) {
			throw new Error(
				`Implemented flag of module ${this.name} already set`
			);
		}

		this._implemented = implemented;
	}
}