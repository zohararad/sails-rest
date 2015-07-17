var url = require('url'),
    Connection = require('./connection'),
    hooks = require('./hooks');

/**
 * sails-rest
 *
 * Most of the methods below are optional.
 *
 * If you don't need / can't get to every method, just implement
 * what you have time for.  The other methods will only fail if
 * you try to call them!
 *
 * For many adapters, this file is all you need.  For very complex adapters, you may need more flexiblity.
 * In any case, it's probably a good idea to start with one file and refactor only if necessary.
 * If you do go that route, it's conventional in Node to create a `./lib` directory for your private submodules
 * and load them at the top of the file with other dependencies.  e.g. var update = `require('./lib/update')`;
 */
module.exports = (function () {


  // You'll want to maintain a reference to each connection
  // that gets registered with this adapter.
  var connections = {};

  // You may also want to store additional, private data
  // per-connection (esp. if your data store uses persistent
  // connections).
  //
  // Keep in mind that models can be configured to use different databases
  // within the same app, at the same time.
  //
  // i.e. if you're writing a MariaDB adapter, you should be aware that one
  // model might be configured as `host="localhost"` and another might be using
  // `host="foo.com"` at the same time.  Same thing goes for user, database,
  // password, or any other config.
  //
  // You don't have to support this feature right off the bat in your
  // adapter, but it ought to get done eventually.
  //

  var adapter = {

    // Set to true if this adapter supports (or requires) things like data types, validations, keys, etc.
    // If true, the schema for models using this adapter will be automatically synced when the server starts.
    // Not terribly relevant if your data store is not SQL/schemaful.
    //
    // If setting syncable, you should consider the migrate option,
    // which allows you to set how the sync will be performed.
    // It can be overridden globally in an app (config/adapters.js)
    // and on a per-model basis.
    //
    // IMPORTANT:
    // `migrate` is not a production data migration solution!
    // In production, always use `migrate: safe`
    //
    // drop   => Drop schema and data, then recreate it
    // alter  => Drop/add columns as necessary.
    // safe   => Don't change anything (good for production DBs)
    //
    syncable: false,

    // Default configuration for connections
    defaults: {
      host:     'localhost:8080',  // api host
      protocol: 'http',            // api HTTP protocol
      pathname: '',                // api endpoint path name
      headers:  {},                // Optional HTTP headers
      hooks: {
        merge:    true,              // flag that indicates whether to merge build-in hooks with user-provided hooks
        before:   [],                // array of hook functions that run before a request
        after:    []                 // array of hook functions that run after a request
      }
    },

    /**
     *
     * This method runs when a model is initially registered
     * at server-start-time.  This is the only required method.
     *
     * @param  {[type]}   connection [description]
     * @param  {[type]}   collection [description]
     * @param  {Function} cb         [description]
     * @return {[type]}              [description]
     */
    registerConnection: function(connection, collections, cb) {
      var config = {hooks: {}, methods: {
        create: 'post',
        find: 'get',
        update: 'put',
        destroy: 'delete'
      }};
      
      if(!connection.identity) return cb(new Error('Connection is missing an identity.'));
      if(connections[connection.identity]) return cb(new Error('Connection is already registered.'));

      // Add in logic here to initialize connection
      // e.g. connections[connection.identity] = new Database(connection, collections);
      config.endpoint = url.format({
        host: connection.host,
        pathname: connection.pathname,
        protocol: connection.protocol
      });
      config.http = connection.http || {};
      config.methods = _.extend(config.methods, (connection.methods || []));

      if(connection.hooks.merge) {
        config.hooks.before = hooks.before.concat(connection.hooks.before || []);
        config.hooks.after = hooks.after.concat(connection.hooks.after || []);
      } else {
        config.hooks.before = connection.hooks.before || [];
        config.hooks.after = connection.hooks.after || [];
      }

      connections[connection.identity] = config;

      cb();
    },


    /**
     * Fired when a model is unregistered, typically when the server
     * is killed. Useful for tearing-down remaining open connections,
     * etc.
     *
     * @param  {Function} cb [description]
     * @return {[type]}      [description]
     */
    // Teardown a Connection
    teardown: function (conn, cb) {

      if (typeof conn == 'function') {
        cb = conn;
        conn = null;
      }
      if (!conn) {
        connections = {};
        return cb();
      }
      if(!connections[conn]) return cb();
      delete connections[conn];
      cb();
    },

    /**
     * Find record(s)
     * @param {String} connection - connection identifier
     * @param {String} collection - collection name. appended to API pathname.
     *                              For example, given the api `http://localhost:8080/api/v1`,
     *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
     * @param {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
     * @param {Function} cb - function to call with query results.
     */
    find: function (connection, collection, options, cb) {
      return Connection.find(connections[connection], collection, options, cb);
    },

    /**
     * Create record(s)
     * @param {String} connection - connection identifier
     * @param {String} collection - collection name. appended to API pathname.
     *                              For example, given the api `http://localhost:8080/api/v1`,
     *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
     * @param {Array<Object>} values - values of records to create.
     * @param {Function} cb - function to call with query results.
     */
    create: function (connection, collection, values, cb) {
      return Connection.create(connections[connection], collection, values, cb);
    },

    /**
     * Update record(s)
     * @param {String} connection - connection identifier
     * @param {String} collection - collection name. appended to API pathname.
     *                              For example, given the api `http://localhost:8080/api/v1`,
     *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
     * @param {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
     * @param {Array<Object>} values - values of records to create.
     * @param {Function} cb - function to call with query results.
     */
    update: function (connection, collection, options, values, cb) {
      return Connection.update(connections[connection], collection, options, values, cb);
    },

    /**
     * Destroy record(s)
     * @param {String} connection - connection identifier
     * @param {String} collection - collection name. appended to API pathname.
     *                              For example, given the api `http://localhost:8080/api/v1`,
     *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
     * @param {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
     * @param {Function} cb - function to call with query results.
     */
    destroy: function (connection, collection, options, cb) {
      return Connection.destroy(connections[connection], collection, options, cb);
    }

  };


  // Expose adapter definition
  return adapter;

})();

