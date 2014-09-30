var tests = require('waterline-adapter-tests'),
    adapter = require('../../SailsRest'),
    mocha = require('mocha'),
    log = require('captains-log')(),
    app = require('../support/app');


// Grab targeted interfaces from this adapter's `package.json` file:
var package = {},
  interfaces = [];
try {
  package = require('../../package.json');
  interfaces = package.waterlineAdapter.interfaces;
} catch (e) {
  throw new Error(
    '\n' +
    'Could not read supported interfaces from `waterlineAdapter.interfaces`' + '\n' +
    'in this adapter\'s `package.json` file ::' + '\n' +
    util.inspect(e)
  );
}



log.info('Testing `' + package.name + '`, a Sails/Waterline adapter.');
log.info('Running `waterline-adapter-tests` against ' + interfaces.length + ' interfaces...');
log.info('( ' + interfaces.join(', ') + ' )');
console.log();
log('Latest draft of Waterline adapter interface spec:');
log('http://links.sailsjs.org/docs/plugins/adapters/interfaces');
console.log();




var config = {
  hostname: 'localhost',
  port: 3000,
  pathname: '/api/v1'
};

app.listen(3000);
var suite = new tests({
  adapter: adapter,
  config: config,

  // The set of adapter interfaces to test against.
  // (grabbed these from this adapter's package.json file above)
  interfaces: interfaces

  // Most databases implement 'semantic' and 'queryable'.
  //
  // As of Sails/Waterline v0.10, the 'associations' interface
  // is also available. If you don't implement 'associations',
  // it will be polyfilled for you by Waterline core. The core
  // implementation will always be used for cross-adapter / cross-connection
  // joins.
  //
  // In future versions of Sails/Waterline, 'queryable' may be also
  // be polyfilled by core.
  //
  // These polyfilled implementations can usually be further optimized at the
  // adapter level, since most databases provide optimizations for internal
  // operations.
  //
  // Full interface reference:
  // https://github.com/balderdashy/sails-docs/blob/master/adapter-specification.md
});
