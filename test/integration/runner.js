/**
 * Run integration tests
 *
 * Uses the `waterline-adapter-tests` module to
 * run mocha tests against the appropriate version
 * of Waterline.  Only the interfaces explicitly
 * declared in this adapter's `package.json` file
 * are tested. (e.g. `queryable`, `semantic`, etc.)
 */


/**
 * Module dependencies
 */

var util = require('util'),
    mocha = require('mocha'),
    log = new (require('captains-log'))(),
    TestRunner = require('waterline-adapter-tests'),
    Adapter = require('../../'),
    app = require('../support/app'),
    package = {},
    interfaces = [],
    server;

// Grab targeted interfaces from this adapter's `package.json` file:
try {
  package = require('../../package.json');
  interfaces = package['waterlineAdapter'].interfaces;
}
catch (e) {
  throw new Error(
    '\n'+
    'Could not read supported interfaces from `waterlineAdapter.interfaces`'+'\n' +
    'in this adapter\'s `package.json` file ::' + '\n' +
    util.inspect(e)
  );
}

log.info('Testing `' + package.name + '`, a Sails/Waterline adapter.');
log.info('Running `waterline-adapter-tests` against ' + interfaces.length + ' interfaces...');
log.info('( ' + interfaces.join(', ') + ' )');
log('Latest draft of Waterline adapter interface spec:');
log('http://links.sailsjs.org/docs/plugins/adapters/interfaces');

server = app.listen(8080, function () {

  var host = server.address().address,
      port = server.address().port;

  log('Example app listening at http://%s:%s', host, port);

  //
  /**
   * Integration Test Runner
   *
   * Uses the `waterline-adapter-tests` module to
   * run mocha tests against the specified interfaces
   * of the currently-implemented Waterline adapter API.
   */
  new TestRunner({

    // Load the adapter module.
    adapter: Adapter,

    // Default adapter config to use.
    config: {
      schema: false,
      host:     'localhost:8080',  // api host
      protocol: 'http',
      pathname: '/api/v1',
      headers: {}
    },

    // The set of adapter interfaces to test against.
    // (grabbed these from this adapter's package.json file above)
    interfaces: interfaces

    // Most databases implement 'semantic' and 'queryable'.
    //
    // As of Sails/Waterline v0.10, the 'associations' interface
    // is also available.  If you don't implement 'associations',
    // it will be polyfilled for you by Waterline core.  The core
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
});
