const expect = require('chai').expect;

function flushCache() {
  const cache = require.cache;

  Object.keys(cache).forEach(e => delete cache[e]);
}

describe('Tests for a dissected script with replaceConstWithVar as false', function() {
  var sample;

  before(function() {
    require('../dissect.js');
    sample = require('./sample.dissect');
  });

  it('exports has exported keys', function() {
    expect(sample.hello).to.be.a('function');
    expect(sample.hello()).to.equal('World!');
    expect(sample.number).to.equal(49);
  });

  it('exports has `__get` and `__set` functions', function() {
    expect(sample.__get).to.be.a('function');
    expect(sample.__set).to.be.a('function');
  });

  it('can get and set file scoped variables', function() {
    expect(sample.__get('fileLevelVar')).to.deep.equal({
      key: 'value'
    });
    expect(sample.__set('fileLevelVar', -1)).to.equal(-1);
    expect(sample.__get('fileLevelVar')).to.equal(-1);
  });

  it('cannot get const and let', function() {
    expect(sample.__get('notExposed')).to.be.undefined;
    expect(sample.__get('notExposedAgain')).to.be.undefined;
  });

  it('can inject new variables and dissected script can use them', function() {
    expect(sample.__get('nonExistent')).to.be.undefined;
    expect(sample.__set('nonExistent', 3)).to.equal(3);
    expect(sample.__get('nonExistent')).to.equal(3);
    expect(sample.returnNonExistent()).to.equal(3);
  });

  it('dissected script can export to global', function() {
    expect(global.thisIsSetBySample).to.be.true;
    expect(global.anotherOneSetBySample).to.be.true;
    delete global.thisIsSetBySample;
    delete global.anotherOneSetBySample;
  });

  it('global is not tainted by dissected script\'s variables', function() {
    expect(global.fileLevelVar).to.be.undefined;
    expect(global.notExposed).to.be.undefined;
    expect(global.nonExistent).to.be.undefined;
  });

  it('stubbing global in dissected script should not affect us', function() {
    const dummyConsole = {
      log: function() { return 3; }
    };

    sample.__set('console', dummyConsole);
    expect(sample.__get('console')).to.equal(dummyConsole);
    expect(sample.consoleTest(4)).to.equal(3);
    expect(console).to.not.equal(dummyConsole);
  });

  it('`__get` should not return global keys', function() {
    global.thisIsInGlobal = 'value';
    expect(sample.__get('thisIsInGlobal')).to.be.undefined;
    delete global.thisIsInGlobal;
  });

  it('dissected scripts are cached', function() {
    expect(require('./sample.dissect')).to.deep.equal(sample);
    expect(require('./sample.js')).to.equal(sample);
  });

  it('non existent scripts throw errors as usual', function() {
    expect(require.bind(null, './same.dissect')).to.throw(Error);
    expect(require.bind(null, './saple.js')).to.throw(Error);
  });

  after(flushCache);
});

describe('Tests for a dissected script with replaceConstWithVar as true', function() {
  var sample;

  before(function() {
    require('../dissect.js')({
      replaceConstWithVar: true
    });
    sample = require('./sample.dissect');
  });

  it('exports has exported keys', function() {
    expect(sample.hello).to.be.a('function');
    expect(sample.hello()).to.equal('World!');
    expect(sample.number).to.equal(49);
  });

  it('exports has `__get` and `__set` functions', function() {
    expect(sample.__get).to.be.a('function');
    expect(sample.__set).to.be.a('function');
  });

  it('can get and set file scoped variables', function() {
    expect(sample.__get('fileLevelVar')).to.deep.equal({
      key: 'value'
    });
    expect(sample.__set('fileLevelVar', -1)).to.equal(-1);
    expect(sample.__get('fileLevelVar')).to.equal(-1);
  });

  it('cannot get const', function() {
    expect(sample.__get('notExposed')).to.be.a('function');
  });

  it('can inject new variables', function() {
    expect(sample.__get('nonExistent')).to.be.undefined;
    expect(sample.__set('nonExistent', 3)).to.equal(3);
    expect(sample.__get('nonExistent')).to.equal(3);
  });

  it('dissected script can export to global', function() {
    expect(global.thisIsSetBySample).to.be.true;
    expect(global.anotherOneSetBySample).to.be.true;
    delete global.thisIsSetBySample;
    delete global.anotherOneSetBySample;
  });

  it('global is not tainted by dissected script\'s variables', function() {
    expect(global.fileLevelVar).to.be.undefined;
    expect(global.notExposed).to.be.undefined;
    expect(global.nonExistent).to.be.undefined;
  });

  it('stubbing global in dissected script should not affect us', function() {
    const dummyConsole = {
      log: function() { return 3; }
    };

    sample.__set('console', dummyConsole);
    expect(sample.__get('console')).to.equal(dummyConsole);
    expect(sample.consoleTest(4)).to.equal(3);
    expect(console).to.not.equal(dummyConsole);
  });

  it('`__get` should not return global keys', function() {
    global.thisIsInGlobal = 'value';
    expect(sample.__get('thisIsInGlobal')).to.be.undefined;
    delete global.thisIsInGlobal;
  });

  it('dissected scripts are cached', function() {
    expect(require('./sample.dissect')).to.deep.equal(sample);
    expect(require('./sample.js')).to.equal(sample);
  });

  it('non existent scripts throw errors as usual', function() {
    expect(require.bind(null, './same.dissect')).to.throw(Error);
    expect(require.bind(null, './saple.js')).to.throw(Error);
  });

  after(flushCache);
});

describe('Tests for a dissected script exporting primitive', function() {
  var sample;

  before(function() {
    require('../dissect.js')({
      replaceConstWithVar: true
    });
    sample = require('./primitive_sample.dissect');
  });

  it('exports has exported keys', function() {
    expect(sample.exports).to.equal(3)
  });

  it('exports has `__get` and `__set` functions', function() {
    expect(sample.__get).to.be.a('function');
    expect(sample.__set).to.be.a('function');
  });

  it('can get and set file scoped variables', function() {
    expect(sample.__get('fileLevelVar')).to.deep.equal({
      key: 'value'
    });
    expect(sample.__set('fileLevelVar', -1)).to.equal(-1);
    expect(sample.__get('fileLevelVar')).to.equal(-1);
  });

  it('cannot get const', function() {
    expect(sample.__get('notExposed')).to.be.a('function');
  });

  it('can inject new variables', function() {
    expect(sample.__get('nonExistent')).to.be.undefined;
    expect(sample.__set('nonExistent', 3)).to.equal(3);
    expect(sample.__get('nonExistent')).to.equal(3);
  });

  it('dissected script can export to global', function() {
    expect(global.thisIsSetBySample).to.be.true;
    expect(global.anotherOneSetBySample).to.be.true;
    delete global.thisIsSetBySample;
    delete global.anotherOneSetBySample;
  });

  it('global is not tainted by dissected script\'s variables', function() {
    expect(global.fileLevelVar).to.be.undefined;
    expect(global.notExposed).to.be.undefined;
    expect(global.nonExistent).to.be.undefined;
  });

  it('`__get` should not return global keys', function() {
    global.thisIsInGlobal = 'value';
    expect(sample.__get('thisIsInGlobal')).to.be.undefined;
    delete global.thisIsInGlobal;
  });

  it('dissected scripts are cached', function() {
    expect(require('./primitive_sample.dissect')).to.deep.equal(sample);
    expect(require('./primitive_sample.js')).to.equal(sample);
  });

  it('non existent scripts throw errors as usual', function() {
    expect(require.bind(null, './same.dissect')).to.throw(Error);
    expect(require.bind(null, './saple.js')).to.throw(Error);
  });

  after(flushCache);
});

describe('Tests for a normal script', function() {
  var sample;

  before(function() {
    require('../dissect.js');
    sample = require('./sample.js');
  });

  it('exports has exported keys', function() {
    expect(sample.hello).to.be.a('function');
    expect(sample.hello()).to.equal('World!');
    expect(sample.number).to.equal(49);
  });

  it('exports does not have `__get` and `__set` functions', function() {
    expect(sample.__get).to.be.undefined;
    expect(sample.__set).to.be.undefined;
  });

  it('normal script can export to global', function() {
    expect(global.thisIsSetBySample).to.be.true;
    expect(global.anotherOneSetBySample).to.be.true;
  });

  it('global is not tainted by normal script\'s variables', function() {
    expect(global.fileLevelVar).to.be.undefined;
    expect(global.notExposed).to.be.undefined;
  });

  it('normal scripts are cached', function() {
    expect(require('./sample.js')).to.deep.equal(sample);
  });

  it('non existent scripts throw errors as usual', function() {
    expect(require.bind(null, './same.dissect')).to.throw(Error);
    expect(require.bind(null, './saple.js')).to.throw(Error);
  });

  after(flushCache);
});
