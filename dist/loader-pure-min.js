!function(){var global={};global.__CONFIG__=window.__CONFIG__,function(e,t){"use strict";var n=t(e);"object"==typeof module&&module&&(module.exports=n),"function"==typeof define&&define.amd&&define(t),e.EventEmitter=n}("undefined"!=typeof global?global:this,function(e){"use strict";function t(){this._events={}}return t.prototype={constructor:t,on:function(e,t){var n=this._events[e]=this._events[e]||[];n.push(t)},off:function(e,t){var n=this._events[e];if(n){var o=n.indexOf(t);o>-1&&n.splice(o,1)}},emit:function(e,t){var n=this._events[e];if(n){n=n.slice(0);for(var o=0;o<n.length;o++){var i=n[o];i.call(i,t)}}}},t}),function(e,t){"use strict";var n=t(e);"object"==typeof module&&module&&(module.exports=n),"function"==typeof define&&define.amd&&define(t),e.ConfigParser=n}("undefined"!=typeof global?global:this,function(e){"use strict";function t(e){this._config={},this._modules={},this._conditionalModules={},this._parseConfig(e)}return t.prototype={constructor:t,addModule:function(e){var t=this._modules[e.name];if(t)for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n]);else this._modules[e.name]=e;return this._registerConditionalModule(e),this._modules[e.name]},getConfig:function(){return this._config},getConditionalModules:function(){return this._conditionalModules},getModules:function(){return this._modules},mapModule:function(e){if(!this._config.maps)return e;var t;t=Array.isArray(e)?e:[e];for(var n=0;n<t.length;n++){var o=t[n],i=!1;for(var r in this._config.maps)if(Object.prototype.hasOwnProperty.call(this._config.maps,r)&&(o===r||0===o.indexOf(r+"/"))){o=this._config.maps[r]+o.substring(r.length),t[n]=o,i=!0;break}i||"function"!=typeof this._config.maps["*"]||(t[n]=this._config.maps["*"](o))}return Array.isArray(e)?t:t[0]},_parseConfig:function(e){for(var t in e)Object.prototype.hasOwnProperty.call(e,t)&&("modules"===t?this._parseModules(e[t]):this._config[t]=e[t]);return this._config},_parseModules:function(e){for(var t in e)if(Object.prototype.hasOwnProperty.call(e,t)){var n=e[t];n.name=t,this.addModule(n)}return this._modules},_registerConditionalModule:function(e){if(e.condition){var t=this._conditionalModules[e.condition.trigger];t||(this._conditionalModules[e.condition.trigger]=t=[]),t.push(e.name)}}},t}),function(e,t){"use strict";var n=t(e);"object"==typeof module&&module&&(module.exports=n),"function"==typeof define&&define.amd&&define(t),e.DependencyBuilder=n}("undefined"!=typeof global?global:this,function(global){"use strict";function DependencyBuilder(e){this._configParser=e,this._pathResolver=new global.PathResolver,this._result=[]}var hasOwnProperty=Object.prototype.hasOwnProperty;return DependencyBuilder.prototype={constructor:DependencyBuilder,resolveDependencies:function(e){this._queue=e.slice(0);var t;try{this._resolveDependencies(),t=this._result.reverse().slice(0)}finally{this._cleanup()}return t},_cleanup:function(){var e=this._configParser.getModules();for(var t in e)if(hasOwnProperty.call(e,t)){var n=e[t];n.conditionalMark=!1,n.mark=!1,n.tmpMark=!1}this._queue.length=0,this._result.length=0},_processConditionalModules:function(e){var t=this._configParser.getConditionalModules()[e.name];if(t&&!e.conditionalMark){for(var n=this._configParser.getModules(),o=0;o<t.length;o++){var i=n[t[o]];this._queue.indexOf(i.name)===-1&&this._testConditionalModule(i.condition.test)&&this._queue.push(i.name)}e.conditionalMark=!0}},_resolveDependencies:function(){for(var e=this._configParser.getModules(),t=0;t<this._queue.length;t++){var n=e[this._queue[t]];n||(n=this._configParser.addModule({name:this._queue[t],dependencies:[]})),n.mark||this._visit(n)}},_testConditionalModule:function(testFunction){return"function"==typeof testFunction?testFunction():eval("false || "+testFunction)()},_visit:function(e){if(e.tmpMark)throw new Error("Error processing module: "+e.name+". The provided configuration is not Directed Acyclic Graph.");if(this._processConditionalModules(e),!e.mark){e.tmpMark=!0;for(var t=this._configParser.getModules(),n=0;n<e.dependencies.length;n++){var o=e.dependencies[n];if("exports"!==o&&"module"!==o){o=this._pathResolver.resolvePath(e.name,o);var i=this._configParser.mapModule(o),r=t[i];r||(r=this._configParser.addModule({name:i,dependencies:[]})),this._visit(r)}}e.mark=!0,e.tmpMark=!1,this._result.unshift(e.name)}},_queue:[]},DependencyBuilder}),function(e,t){"use strict";var n=t(e);"object"==typeof module&&module&&(module.exports=n),"function"==typeof define&&define.amd&&define(t),e.URLBuilder=n}("undefined"!=typeof global?global:this,function(e){"use strict";function t(e){this._configParser=e}var n=/^https?:\/\/|\/\/|www\./;return t.prototype={constructor:t,build:function(e){var t=[],o=[],i=[],r=[],s=[],a=this._configParser.getConfig(),l=a.basePath||"",u=this._configParser.getModules();l.length&&"/"!==l.charAt(l.length-1)&&(l+="/");for(var d=0;d<e.length;d++){var f=u[e[d]];if(f.fullPath)s.push({modules:[f.name],url:this._getURLWithParams(f.fullPath)});else{var c=this._getModulePath(f),p=0===c.indexOf("/");n.test(c)?s.push({modules:[f.name],url:this._getURLWithParams(c)}):!a.combine||f.anonymous?s.push({modules:[f.name],url:this._getURLWithParams(a.url+(p?"":l)+c)}):p?(t.push(c),i.push(f.name)):(o.push(c),r.push(f.name))}f.requested=!0}return o.length&&(s=s.concat(this._generateBufferURLs(r,o,{basePath:l,url:a.url,urlMaxLength:a.urlMaxLength})),o.length=0),t.length&&(s=s.concat(this._generateBufferURLs(i,t,{url:a.url,urlMaxLength:a.urlMaxLength})),t.length=0),s},_generateBufferURLs:function(e,t,n){var o,i=n.basePath||"",r=[],s=n.urlMaxLength||2e3,a={modules:[e[0]],url:n.url+i+t[0]};for(o=1;o<t.length;o++){var l=e[o],u=t[o];a.url.length+i.length+u.length+1<s?(a.modules.push(l),a.url+="&"+i+u):(r.push(a),a={modules:[l],url:n.url+i+u})}return a.url=this._getURLWithParams(a.url),r.push(a),r},_getModulePath:function(e){var t=e.path||e.name,o=this._configParser.getConfig().paths||{},i=!1;return Object.keys(o).forEach(function(e){t!==e&&0!==t.indexOf(e+"/")||(t=o[e]+t.substring(e.length))}),i||"function"!=typeof o["*"]||(t=o["*"](t)),n.test(t)||t.indexOf(".js")===t.length-3||(t+=".js"),t},_getURLWithParams:function(e){var t=this._configParser.getConfig(),n=t.defaultURLParams||{},o=Object.keys(n);if(!o.length)return e;var i=o.map(function(e){return e+"="+n[e]}).join("&");return e+(e.indexOf("?")>-1?"&":"?")+i}},t}),function(e,t){"use strict";var n=t(e);"object"==typeof module&&module&&(module.exports=n),"function"==typeof define&&define.amd&&define(t),e.PathResolver=n}("undefined"!=typeof global?global:this,function(e){"use strict";function t(){}return t.prototype={constructor:t,resolvePath:function(e,t){if("exports"===t||"module"===t||0!==t.indexOf(".")&&0!==t.indexOf(".."))return t;var n=e.split("/");n.splice(-1,1);for(var o=t.split("/"),i=o.splice(-1,1),r=0;r<o.length;r++){var s=o[r];if("."!==s)if(".."===s){if(!n.length){n=n.concat(o.slice(r));break}n.splice(-1,1)}else n.push(s)}return n.push(i),n.join("/")}},t}),function(e,t){"use strict";var n=t(e);"object"==typeof module&&module&&(module.exports=n),"function"==typeof define&&define.amd&&define(t),e.Loader=new n,e.require=e.Loader.require.bind(e.Loader),e.define=e.Loader.define.bind(e.Loader),e.define.amd={}}("undefined"!=typeof global?global:this,function(e){"use strict";function t(n){t.superclass.constructor.apply(this,arguments),this._config=n||e.__CONFIG__,this._modulesMap={}}t.prototype=Object.create(e.EventEmitter.prototype),t.prototype.constructor=t,t.superclass=e.EventEmitter.prototype;var n={addModule:function(e){return this._getConfigParser().addModule(e)},define:function(){var e=this,t=arguments[0],n=arguments[1],o=arguments[2],i=arguments[3]||{};i.anonymous=!1;var r=arguments.length;if(r<2?(o=arguments[0],n=["module","exports"],i.anonymous=!0):2===r&&("string"==typeof t?(n=["module","exports"],o=arguments[1]):(n=arguments[0],o=arguments[1],i.anonymous=!0)),i.anonymous){var s=function(t){if(e.off("scriptLoaded",s),1!==t.length)e._reportMismatchedAnonymousModules(o.toString());else{var r=t[0],a=e.getModules()[r];a&&a.pendingImplementation&&e._reportMismatchedAnonymousModules(o.toString()),e._define(r,n,o,i)}};e.on("scriptLoaded",s)}else this._define(t,n,o,i)},getConditionalModules:function(){return this._getConfigParser().getConditionalModules()},getModules:function(){return this._getConfigParser().getModules()},require:function(){var e,t,n,o,i=this;if(Array.isArray(arguments[0]))n=arguments[0],o="function"==typeof arguments[1]?arguments[1]:null,e="function"==typeof arguments[2]?arguments[2]:null;else for(n=[],t=0;t<arguments.length;++t)if("string"==typeof arguments[t])n[t]=arguments[t];else if("function"==typeof arguments[t]){o=arguments[t],e="function"==typeof arguments[++t]?arguments[t]:null;break}var r,s=i._getConfigParser(),a=s.mapModule(n);new Promise(function(e,t){i._resolveDependencies(a).then(function(o){var l=s.getConfig();0!==l.waitTimeout&&(r=setTimeout(function(){var e=s.getModules(),i=new Error("Load timeout for modules: "+n);i.dependecies=o,i.mappedModules=a,i.missingDependencies=o.filter(function(t){return!e[t].implementation}),i.modules=n,t(i)},l.waitTimeout||7e3)),i._loadModules(o).then(e,t)},t)}).then(function(e){if(clearTimeout(r),o){var t=i._getModuleImplementations(a);o.apply(o,t)}},function(t){clearTimeout(r),e&&e.call(e,t)})},_createModulePromise:function(e){var t=this;return new Promise(function(n,o){var i=t._getConfigParser().getModules(),r=i[e];if(r.exports){var s=t._getValueGlobalNS(r.exports);if(s)n(s);else{var a=function(i){if(i.indexOf(e)>=0){t.off("scriptLoaded",a);var s=t._getValueGlobalNS(r.exports);s?n(s):o(new Error("Module "+e+" does not export the specified value: "+r.exports))}};t.on("scriptLoaded",a)}}else{var l=function(o){o===e&&(t.off("moduleRegister",l),t._modulesMap[e]=!0,n(e))};t.on("moduleRegister",l)}})},_define:function(e,t,n,o){var i=o||{},r=this._getConfigParser(),s=this._getPathResolver();t=t.map(function(t){return s.resolvePath(e,t)}),i.name=e,i.dependencies=t,i.pendingImplementation=n,r.addModule(i),this._modulesMap[i.name]||(this._modulesMap[i.name]=!0),this.emit("moduleRegister",e)},_getConfigParser:function(){return this._configParser||(this._configParser=new e.ConfigParser(this._config)),this._configParser},_getDependencyBuilder:function(){return this._dependencyBuilder||(this._dependencyBuilder=new e.DependencyBuilder(this._getConfigParser())),this._dependencyBuilder},_getValueGlobalNS:function(e){for(var t=e.split("."),n=(0,eval)("this")[t[0]],o=1;n&&o<t.length;o++){if(!Object.prototype.hasOwnProperty.call(n,t[o]))return null;n=n[t[o]]}return n},_getMissingDependencies:function(e){for(var t=this._getConfigParser(),n=t.getModules(),o=Object.create(null),i=0;i<e.length;i++)for(var r=n[e[i]],s=t.mapModule(r.dependencies),a=0;a<s.length;a++){var l=s[a],u=n[l];"exports"===l||"module"===l||u&&u.pendingImplementation||(o[l]=1)}return Object.keys(o)},_getModuleImplementations:function(e){for(var t=[],n=this._getConfigParser().getModules(),o=0;o<e.length;o++){var i=n[e[o]];t.push(i?i.implementation:void 0)}return t},_getPathResolver:function(){return this._pathResolver||(this._pathResolver=new e.PathResolver),this._pathResolver},_getURLBuilder:function(){return this._urlBuilder||(this._urlBuilder=new e.URLBuilder(this._getConfigParser())),this._urlBuilder},_filterModulesByProperty:function(e,t){var n=t;"string"==typeof t&&(n=[t]);for(var o=[],i=this._getConfigParser().getModules(),r=0;r<e.length;r++){var s=e[r],a=i[e[r]];if(a){if("exports"!==a&&"module"!==a){for(var l=0,u=0;u<n.length;u++)if(a[n[u]]){l=!0;break}l||o.push(s)}}else o.push(s)}return o},_loadModules:function(e){var t=this;return new Promise(function(n,o){var i=t._filterModulesByProperty(e,["requested","pendingImplementation"]);if(i.length){for(var r=t._getURLBuilder().build(i),s=[],a=0;a<r.length;a++)s.push(t._loadScript(r[a]));Promise.all(s).then(function(n){return t._waitForModules(e)}).then(function(e){n(e)})["catch"](function(e){o(e)})}else t._waitForModules(e).then(function(e){n(e)})["catch"](function(e){o(e)})})},_loadScript:function(e){var t=this;return new Promise(function(n,o){var i=document.createElement("script");i.src=e.url,i.onload=i.onreadystatechange=function(){this.readyState&&"complete"!==this.readyState&&"load"!==this.readyState||(i.onload=i.onreadystatechange=null,n(i),t.emit("scriptLoaded",e.modules))},i.onerror=function(){document.head.removeChild(i),o(i)},document.head.appendChild(i)})},_resolveDependencies:function(e){var t=this;return new Promise(function(n,o){try{var i=t._getDependencyBuilder().resolveDependencies(e);n(i)}catch(r){o(r)}})},_reportMismatchedAnonymousModules:function(e){var t="Mismatched anonymous define() module: "+e,n=this._config.reportMismatchedAnonymousModules;if(!n||"exception"===n)throw new Error(t);console&&console[n]&&console[n].call(console,t)},_setModuleImplementation:function(e){for(var t=this._getConfigParser().getModules(),n=0;n<e.length;n++){var o=e[n];if(!o.implementation)if(o.exports)o.pendingImplementation=o.implementation=this._getValueGlobalNS(o.exports);else{for(var i,r=[],s=this._getConfigParser(),a=0;a<o.dependencies.length;a++){var l=o.dependencies[a];if("exports"===l)i={},r.push(i);else if("module"===l)i={exports:{}},r.push(i);else{var u=t[s.mapModule(l)],d=u.implementation;r.push(d)}}var f;f="function"==typeof o.pendingImplementation?o.pendingImplementation.apply(o.pendingImplementation,r):o.pendingImplementation,f?o.implementation=f:i&&(o.implementation=i.exports||i)}}},_waitForModule:function(e){var t=this,n=t._modulesMap[e];return n||(n=t._createModulePromise(e),t._modulesMap[e]=n),n},_waitForModules:function(e){var t=this;return new Promise(function(n,o){for(var i=[],r=0;r<e.length;r++)i.push(t._waitForModule(e[r]));Promise.all(i).then(function(i){var r=t._getConfigParser().getModules(),s=function(){for(var o=[],i=0;i<e.length;i++)o.push(r[e[i]]);t._setModuleImplementation(o),n(o)},a=t._getMissingDependencies(e);a.length?t.require(a,s,o):s()},o)})}};return Object.keys(n).forEach(function(e){t.prototype[e]=n[e]}),t.prototype.define.amd={},t});var namespace=null,exposeGlobal=!0;if("object"==typeof global.__CONFIG__&&("string"==typeof global.__CONFIG__.namespace&&(namespace=global.__CONFIG__.namespace),"boolean"==typeof global.__CONFIG__.exposeGlobal&&(exposeGlobal=global.__CONFIG__.exposeGlobal)),namespace){var ns=window[global.__CONFIG__.namespace]?window[global.__CONFIG__.namespace]:{};ns.Loader=global.Loader,window[global.__CONFIG__.namespace]=ns}else window.Loader=global.Loader;exposeGlobal&&(window.Loader=global.Loader,window.require=global.require,window.define=global.define)}();