'use strict';

global.thisIsSetBySample = true;

var fileLevelVar = {
  key: 'value'
};

var expect = require('chai').expect;

expect(console.log).to.be.a('function');
expect(thisIsSetBySample).to.be.true;

(function() {
  global.anotherOneSetBySample = true;
})();

const notExposed = function() {
  return 'Hello there!';
};

let notExposedAgain = 34;

module.exports = 3;