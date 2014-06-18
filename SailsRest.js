/*---------------------------------------------------------------
  :: sails-rest
  -> adapter
---------------------------------------------------------------*/

var Errors = require('waterline-errors').adapter,
  async = require('async'),
  restify = require('restify'),
  url = require('url'),
  _ = require('lodash');

module.exports = (function() {
  "use strict";

  var connections = {};

  // Private functions
  /**
   * Format result object according to schema
   * @param result result object
   * @param collectionName name of collection the result object belongs to
   * @param config object representing the connection configuration
   * @param definition object representing the collection definition
   * @returns {*}
   */
  function formatResult(result, collectionName, config, definition) {
    if (_.isFunction(config.beforeFormatResult)) {
      result = config.beforeFormatResult(result);
    }

    _.each(definition, function(def, key) {
      if (def.type.match(/date/i)) {
        result[key] = new Date(result[key] ? result[key] : null);
      }
    });

    if (_.isFunction(config.afterFormatResult)) {
      result = config.afterFormatResult(result);
    }

    return result;
  }

  /**
   * Format results according to schema
   * @param results array of result objects (model instances)
   * @param collectionName name of collection the result object belongs to
   * @param config object representing the connection configuration
   * @param definition object representing the collection definition
   * @returns {*}
   */
  function formatResults(results, collectionName, config, definition) {
    if (_.isFunction(config.beforeFormatResults)) {
      results = config.beforeFormatResults(results);
    }

    results.forEach(function(result) {
      formatResult(result, collectionName, config, definition);
    });

    if (_.isFunction(config.afterFormatResults)) {
      results = config.afterFormatResults(results);
    }

    return results;
  }

  /**
   * Ensure results are contained in an array. Resolves variants in API responses such as `results` or `objects` instead of `[.....]`
   * @param data response data to format as results array
   * @param collectionName name of collection the result object belongs to
   * @param config object representing the connection configuration
   * @param definition object representing the collection definition
   * @returns {*}
   */
  function getResultsAsCollection(data, collectionName, config, definition) {
    var d = (data.objects || data.results || data),
      a = _.isArray(d) ? d : [d];

    return formatResults(a, collectionName, config, definition);
  }

  /**
   * Makes a REST request via restify
   * @param identity type of connection interface
   * @param collectionName name of collection the result object belongs to
   * @param methodName name of CRUD method being used
   * @param cb callback from method
   * @param options options from method
   * @param values values from method
   * @returns {*}
   */
  function makeRequest(identity, collectionName, methodName, cb, options, values) {
    var r = null,
      opt = null,
      cache = connections[identity].cache,
      config = _.cloneDeep(connections[identity].config),
      connection = connections[identity].connection,
      definition = connections[identity].definition,
      restMethod = config.methods[methodName],
      pathname;

    // Override config settings from options if available
    if (options && _.isPlainObject(options)) {
      _.each(config, function(val, key) {
        if (_.has(options, key)) {
          config[key] = options[key];
        }
      });
    }

    pathname = config.pathname + '/' + config.resource + (config.action ? '/' + config.action : '');

    if (options && options.where) {
      // Add id to pathname if provided
      if (options.where.id) {
        pathname += '/' + options.where.id;
        delete options.where.id;
      } else if (methodName === 'destroy' || methodName == 'update') {
        // Find all and make new request for each.
        makeRequest(identity, collectionName, 'find', function(error, results) {
          if (error) {
            cb(error);
          } else {
            _.each(results, function(result, i) {
              options = {
                where: {
                  id: result.id
                }
              };

              makeRequest(identity, collectionName, methodName, (i + 1) === results.length ? cb : function() {}, options, values);
            });
          }
        }, options);

        return;
      }

      // Add where statement as query parameters if requesting via GET
      if (restMethod === 'get') {
        _.extend(config.query, options.where);
        _.extend(config.query, {
          limit: options.limit,
          offset: options.skip
        });
      }
      // Set opt if additional where statements are available
      else if (_.size(options.where)) {
        opt = options.where;
      } else {
        delete options.where;
      }
    }

    if (!opt && values) {
      opt = values;

      if (options) {
        opt = _.extend(options, opt);
      }
    }

    // Add pathname to connection
    _.extend(config, {
      pathname: pathname
    });

    // Format URI
    var uri = url.format(config);

    // Retrieve data from the cache
    if (methodName === 'find') {
      r = cache && cache.engine.get(uri);
    }

    if (r) {
      cb(null, r);
    } else if (_.isFunction(connection[restMethod])) {
      var path = uri.replace(connection.url.href, '/');

      var callback = function(err, req, res, obj) {
        if (err && (typeof res === 'undefined' || res === null || res.statusCode !== 404)) {
          cb(err);
        } else if (err && res.statusCode === 404) {
          cb(null, []);
        } else {
          if (methodName === 'find') {
            r = getResultsAsCollection(obj, collectionName, config, definition);

            if (cache) {
              cache.engine.set(uri, r);
            }
          } else {
            r = formatResult(obj, collectionName, config, definition);

            if (cache) {
              cache.engine.del(uri);
            }
          }

          cb(null, r);
        }
      };

      // Make request via restify
      if (opt) {
        connection[restMethod](path, opt, callback);
      } else {
        connection[restMethod](path, callback);
      }
    } else {
      cb(new Error('Invalid REST method: ' + restMethod));
    }

    return false;
  }

  // Adapter
  var adapter = {

    syncable: false,

    defaults: {
      type: 'json',
      host: 'localhost',
      port: 80,
      protocol: 'http',
      pathname: '',
      resource: null,
      action: null,
      query: {},
      methods: {
        create: 'post',
        find: 'get',
        update: 'put',
        destroy: 'del'
      },
      beforeFormatResult: null,
      afterFormatResult: null,
      beforeFormatResults: null,
      afterFormatResults: null
    },

    registerConnection: function(connection, collections, cb) {
      if (!connection.identity) return cb(Errors.IdentityMissing);
      if (connections[connection.identity]) return cb(Errors.IdentityDuplicate);

      var config, clientMethod, instance;

      config = this.defaults ? _.extend({}, this.defaults, connection) : connection;
      config.methods = this.defaults ? _.extend({}, this.defaults.methods, connection.methods) : connection.methods;
      clientMethod = 'create' + config.type.substr(0, 1).toUpperCase() + config.type.substr(1).toLowerCase() + 'Client';

      if (!_.isFunction(restify[clientMethod])) {
        throw new Error('Invalid type provided');
      }

      instance = {
        config: config,
        connection: restify[clientMethod]({
          url: url.format({
            protocol: config.protocol,
            hostname: config.host,
            port: config.port
          }),
          headers: config.headers
        })
      };

      if (config.basicAuth) {
        instance.connection.basicAuth(config.basicAuth.username, config.basicAuth.password);
      }

      if (config.cache) {
        instance.cache = config.cache;
      }

      connections[connection.identity] = instance;

      cb();
    },

    create: function(connection, collectionName, values, cb) {
      makeRequest(connection, collectionName, 'create', cb, null, values);
    },

    find: function(connection, collectionName, options, cb) {
      makeRequest(connection, collectionName, 'find', cb, options);
    },

    update: function(connection, collectionName, options, values, cb) {
      makeRequest(connection, collectionName, 'update', cb, options, values);
    },

    destroy: function(connection, collectionName, options, cb) {
      makeRequest(connection, collectionName, 'destroy', cb, options);
    },

    drop: function(connection, collectionName, relations, cb) {
      cb();
    },

    define: function(connection, collectionName, definition, cb) {
      connections[connection].definition = definition;
      cb();
    },

    describe: function(connection, collectionName, cb) {
      cb(null, connections[connection].definition);
    }
  };

  return adapter;
}());