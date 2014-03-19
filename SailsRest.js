/*---------------------------------------------------------------
  :: sails-rest
  -> adapter
---------------------------------------------------------------*/

var async   = require('async'),
    restify = require('restify'),
    url     = require('url'),
    _       = require('lodash'),
    util    = require('util');

module.exports = (function(){
  "use strict";

  var collections = {};

  // Private functions
  /**
   * Format result object according to schema
   * @param result result object
   * @param collectionName name of collection the result object belongs to
   * @returns {*}
   */
  function formatResult(result, collectionName, config){
    if (_.isFunction(config.beforeFormatResult)) {
      result = config.beforeFormatResult(result);
    }

    _.each(collections[collectionName].definition, function(def, key) {
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
   * @returns {*}
   */
  function formatResults(results, collectionName, config){
    if (_.isFunction(config.beforeFormatResults)) {
      results = config.beforeFormatResults(results);
    }

    results.forEach(function(result) {
      formatResult(result, collectionName, config);
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
   * @returns {*}
   */
  function getResultsAsCollection(data, collectionName, config){
    var d = (data.objects || data.results || data),
        a = _.isArray(d) ? d : [d];

    return formatResults(a, collectionName, config);
  }

  /**
   * Makes a REST request via restify
   * @param collectionName name of collection the result object belongs to
   * @param methodName name of CRUD method being used
   * @param cb callback from method
   * @param options options from method
   * @param values values from method
   * @returns {*}
   */
  function makeRequest(collectionName, methodName, cb, options, values) {
    var r = null,
        opt = null,
        cache = collections[collectionName].cache,
        config = _.cloneDeep(collections[collectionName].config),
        connection = collections[collectionName].connection,
        restMethod = config.methods[methodName];

    // Override config settings from options if available
    if (options && _.isPlainObject(options)) {
      _.each(config, function(val, key) {
        if (_.has(options, key)) {
          config[key] = options[key];
        }
      });
    }

    var pathname = config.pathname + '/' + config.resource + (config.action ? '/' + config.action : '');

    if (options && options.where) {
      // Add id to pathname if provided
      if (options.where.id) {
        pathname += '/'+ options.where.id;
        delete options.where.id;
      }
      else if (methodName === 'destroy' || methodName == 'update') {
        // Find all and make new request for each.
        makeRequest(collectionName, 'find', function(error, results) {
          if (error) {
            cb(error);
          }
          else {
            _.each(results, function(result, i) {
              options = {
                where: {
                  id: result.id
                }
              };

              makeRequest(collectionName, methodName, (i + 1) === results.length ? cb : function(){}, options, values);
            });
          }
        }, options);

        return;
      }

      // Add where statement as query parameters if requesting via GET
      if (restMethod === 'get') {
        _.extend(config.query, options.where);
      }
      // Set opt if additional where statements are available
      else if (_.size(options.where)) {
        opt = options.where;
      }
      else {
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
    _.extend(config, {pathname: pathname});

    // Format URI
    var uri = url.format(config);

    // Retrieve data from the cache
    if (methodName === 'find') {
      r = cache && cache.engine.get(uri);
    }

    if (r) {
      cb(null, r);
    }
    else if (_.isFunction(connection[restMethod])) {
      var path = uri.replace(connection.url.href, '/');

      var callback = function(err, req, res, obj) {
        if (err && res.statusCode !== 404) {
          cb(err);
        }
        else if (err && res.statusCode === 404) { 
          cb(null, []);
        }
        else {
          if (methodName === 'find') {
            r = getResultsAsCollection(obj, collectionName, config);

            if (cache) {
              cache.engine.set(uri, r);
            }
          }
          else {
            r = formatResult(obj, collectionName, config);

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
      }
      else {
        connection[restMethod](path, callback);
      }
    }
    else {
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

    registerCollection: function(collection, cb) {
      var config, clientMethod, instance;

      config       = collection.defaults ? _.extend({}, collection.defaults, collection.config) : collection.config;
      clientMethod = 'create' + config.type.substr(0, 1).toUpperCase() + config.type.substr(1).toLowerCase() + 'Client';

      if (!_.isFunction(restify[clientMethod])) {
        throw new Error('Invalid type provided');
      }

      instance = {
        config: {
          protocol: config.protocol,
          hostname: config.host,
          port: config.port,
          pathname: config.pathname,
          headers: config.headers,
          query: config.query,
          resource: config.resource || collection.identity,
          action: config.action,
          methods: collection.defaults ? _.extend({}, collection.defaults.methods, config.methods) : config.methods,
          beforeFormatResult: config.beforeFormatResult,
          afterFormatResult: config.afterFormatResult,
          beforeFormatResults: config.beforeFormatResults,
          afterFormatResults: config.afterFormatResults
        },

        connection: restify[clientMethod]({
          url: url.format({
            protocol: config.protocol,
            hostname: config.host,
            port: config.port
          })
        }),

        definition: collection.definition
      };

      if (collection.config.basicAuth) {
        instance.connection.basicAuth(config.basicAuth.username, config.basicAuth.password);
      }

      if (collection.config.cache) {
        instance.cache = collection.config.cache;
      }

      collections[collection.identity] = instance;

      cb();
    },

    create: function(collectionName, values, cb) {
      makeRequest(collectionName, 'create', cb, null, values);
    },

    find: function(collectionName, options, cb){
      makeRequest(collectionName, 'find', cb, options);
    },

    update: function(collectionName, options, values, cb) {
      makeRequest(collectionName, 'update', cb, options, values);
    },

    destroy: function(collectionName, options, cb) {
      makeRequest(collectionName, 'destroy', cb, options);
    },

    drop: function(collectionName, cb) {
      cb();
    },

    describe: function(collectionName, cb) {
      cb(null, collections[collectionName].definition);
    }
  };

  return adapter;
}());
