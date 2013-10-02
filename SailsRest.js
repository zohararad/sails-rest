/*---------------------------------------------------------------
  :: sails-rest
  -> adapter
---------------------------------------------------------------*/

var async = require('async'),
    rest = require('restler'),
    url = require('url'),
    _   = require('lodash');

module.exports = (function(){
  "use strict";

  var connections ={},
      defs = {},
      cache = {};

  // Private functions
  /**
   * Format result object according to schema
   * @param result result object
   * @param collectionName name of collection the result object belongs to
   * @returns {*}
   */
  function formatResult(result, collectionName){
    var def, schema = defs[collectionName];
    for(def in schema) {
      if(schema.hasOwnProperty(def)){
        var d = schema[def];
        if(d.type.toLowerCase().indexOf('date') > -1 && result[def]){
          result[def] = new Date(result[def]);
        }
      }
    }
    return result;
  }

  /**
   * Format results according to schema
   * @param results array of result objects (model instances)
   * @param collectionName name of collection the result object belongs to
   * @returns {*}
   */
  function formatResults(results, collectionName){
    results.forEach(function(result){
      formatResult(results, collectionName);
    });
    return results;
  }

  /**
   * Ensure results are contained in an array. Resolves variants in API responses such as `results` or `objects` instead of `[.....]`
   * @param data response data to format as results array
   * @param collectionName name of collection the result object belongs to
   * @returns {*}
   */
  function getResultsAsCollection(data, collectionName){
    var d = (data.objects || data.results || data),
        a = _.isArray(d) ? d : [d];
    return formatResults(a, collectionName);
  }

  /**
   * Makes a REST request via restler
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
        restMethod = connections[collectionName].methods[methodName],
        connection = _.clone(connections[collectionName]),
        pathname = connection.pathname + '/' + connection.resource + (connection.action ? '/' + connection.action : '');

    if (options && options.where) {
      // Add id to pathname if provided
      if (options.where.id) {
        pathname += '/'+ options.where.id;
        delete options.where.id;
      }

      // Add where statement as query parameters if requesting via GET
      if (restMethod === 'get') {
        _.extend(connection.query, options.where);
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
      opt = {data: values};

      if (options) {
        opt = _.extend(options, opt);
      }
    }

    // Add pathname to connection
    _.extend(connection, {pathname: pathname});

    // Format URI
    var uri = url.format(connection);

    // Retrieve data from the cache 
    if (methodName === 'find') {
      r = cache[collectionName] && cache[collectionName].engine.get(uri);
    }
    
    if (r) {
      cb(null, r);
    }
    else if (_.isFunction(rest[restMethod])) {
      // Make request via restler
      rest[restMethod](uri, opt).on('complete', function(result, response) {
        if (result instanceof Error || (response && response.statusCode && (response.statusCode < 200 || response.statusCode >= 300))) {
          cb(result);
        }
        else {
          if (methodName === 'find') {
            r = getResultsAsCollection(result, collectionName);

            if (cache[collectionName]) {
              cache[collectionName].engine.set(uri, r);
            }
          }
          else {
            r = formatResult(result, collectionName);

            if (cache[collectionName]) {
              cache[collectionName].engine.del(uri);
            }
          }

          cb(null, r);
        }
      });
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
        destroy: 'delete'
      }
    },

    registerCollection: function(collection, cb) {
      defs[collection.identity] = collection.definition;

      if (collection.config.cache) {
        cache[collection.identity] = collection.config.cache;
      }

      var c = _.extend({}, collection.defaults, collection.config);

      connections[collection.identity] = {
        protocol: c.protocol,
        hostname: c.host,
        port: c.port,
        pathname: c.pathname,
        query: c.query,
        resource: c.resource || collection.identity,
        action: c.action,
        methods: _.extend({}, collection.defaults.methods, c.methods)
      };

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
      makeRequest(collectionName, 'delete', cb, options);
    },

    drop: function(collectionName, cb) {
      cb();
    },

    describe: function(collectionName, cb) {
      cb(null, defs[collectionName]);
    }
  };

  return adapter;
}());