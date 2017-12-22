const Module = require('module');

const shebangRe = /^\#\!.*/;

const CONFIGURATIONS = {
  replaceConstWithVar: false,
  clearCache: false
};

var toDissect = null;

function replaceConst(content) {
  /**
   *  Nasty way of replacing block scope declaration. Needs a better way.
   */
  return CONFIGURATIONS.replaceConstWithVar === true ? content.replace(/const |let /g, 'var ') : content;
}

function wrap(content) {
  return `
    const vm = require('vm');

    /**
     *  Serves as the context for the module to be dissected. Not that the module's content is not
     *  wrappered inside a function as NodeJS usually does. Instead, the contents are executed directly
     *  without any outer functional scope.
     */
    const context = { exports, require, module, __filename, __dirname, global, __proto__: global };

    const code = ${JSON.stringify(content)};

    vm.runInContext(code, vm.createContext(context), {
      filename: __filename,
      displayErrors: true
    });

    if (!Object.isExtensible(module.exports)) {
      module.exports = {
        exports: module.exports
      };
    }

    module.exports.__get = key => context.hasOwnProperty(key) ? context[key] : undefined,
    module.exports.__set = (key, value) => context[key] = value;
  `;
}

const originalCompile = Module.prototype._compile;

Module.prototype._compile = function(content, filename) {
  content = content.replace(shebangRe, '');

  if (filename === toDissect) {
    content = replaceConst(wrap(content));
  }

  originalCompile.call(this, content, filename);
};

const originalRequire = Module.prototype.require;

Module.prototype.require = function(request) {
  /**
   *  Dissect only those modules which are required with the "dissect"
   *  extension. Very unintuitive. Needs a better solution.
   */
  if (request.endsWith('.dissect')) {
    request = `${request.slice(0, -8)}.js`;

    try {
      toDissect = Module._resolveFilename(request, this);
    } catch(e) { toDissect = null; }
  }

  const temp = originalRequire.call(this, request);

  if (CONFIGURATIONS.clearCache) {
    delete Module._cache[toDissect];
  }

  toDissect = null;

  return temp;
};

module.exports = function(configurations) {
  Object.assign(CONFIGURATIONS, configurations);
};
