# dissect

`dissect` exposes private variables within modules allowing developers to write significantly more granular unit tests.

Inspired by [rewire](https://github.com/jhnns/rewire).

Supports Node 4+ (might work for other version; don't know, don't care)

### Examples

Consider the following module to be under test

```javascript
// index.js
var request = require('request');

var generateAPIEndpoint = slackMethod => `https://slack.com/api/${slackMethod}`;

function makeCall(slackMethod, options, doneCalling) {
  const temp = Object.assign({
      url: generateAPIEndpoint(slackMethod)
    }, options);

  return request(temp, doneCalling);
}

module.exports = {
    createConversation: makeCall.bind(null, 'conversation.create'),
    closeConversation: makeCall.bind(null, 'conversation.close')
};

```

With `dissect`, you can

```javascript
// test/unit/index.js

// One off require per node process
require('dissect');

// note the `dissect` extension
var index = require('../../index.dissect');

var temp = index.__get('generateAPIEndpoint');

console.log(temp); // [Function]

console.log(temp('dummy')); // "https://slack.com/api/dummy"

index.__set('generateAPIEndpoint', function(slackMethod) {
  return `localhost:7651/api/${slackMethod}`
});

index.createConversation(someOptions, console.log); // call now goes to localhost at port 7651
```
`global` is available to the dissected module as one would expect. So the following are possible within the dissected module,

```javascript
global.hello = 'there' // available throughout the node process

console.log('hello!') // console is available through the global object

process.env = {} // `process.env` is now an empty object everywhere.
```

You can also "inject" variables into the dissected script's scope

```javascript
// a.js
module.exports = {
  returnNonExistent: function() {
    return nonExistent;
  }
};

// dissector.js
require('dissect');

var a = require('a.dissect');

a.__set('nonExistent', 3);

console.log(a.returnNonExistent()); // 3
```

### Usage

```javascript
const dissectConfigure = require('dissect');

dissectConfigure({
  replaceConstWithVar: <Boolean>, // Should `const` and `let` declarations be changed to `var`? (defaults to false)
  clearCache: <Boolean> // Should the dissected module to cached? (defaults to false)
});

const underTest = require('someModule.dissect');

underTest.__get || underTest.__set

underTest.normallyExportedThings;
```

### Limitations

#### IIFE
Variables within `IIFE` cannot be exposed.

```javascript
(function() {
    var a = 3; // cannot be accessed
})();
```

#### Primitive exports

Modules that export primitives will behave slightly differently.

```javascript
// a.js
modules.exports = 3;

// dissector.js
require('dissect');

var a = require('a.dissect');

a.__get // function
a.__set // function
a.exports // 3
```

### Notes
  1. Dissected modules, similar to normal modules, are cached by default. This can be overridden via the `clearCache` configuration.
  2. Variables declared using `const` and `let` are not exposed via the getter. This can be overcome by changing the `const` and `let` to `var`. This behaviour can be toggled using `replaceConstWithVar` configuration.
  3. `__get` only returns values that are declared within the module under dissection. `__get('console')` will usually return `undefined` unless `console` is defined within the module explicitly.
  4. When using with Node 4, `strict` mode is assumed to turned on.
  5. Please configure **before** dissecting. Once dissected, the exports will remain the same. (unless `clearCache` is set)
  6. Please dissect only one module at a time (only the module currently under test) Dissecting multiple modules (nested or otherwise) is supported but might result in unexpected behaviour.
