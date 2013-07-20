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

  var connection = {},
      defs = {},
      cache;

  // Private functions
  /**
   * Resolves collection name to API path
   * @param collectionName collection name
   * @param options API query options
   * @returns {string}
   */
  function resolvePath(collectionName, options){
    var pathname = connection.pathname + '/' + collectionName;
    if(options && options.where && options.where.id){
      pathname += '/'+ options.where.id;
      delete options.where.id;
    }
    return pathname;
  }

  /**
   * Get resolved API resource URL, including resource path and query string
   * @param collectionName collection name
   * @param options API query options
   * @returns {Object|ServerResponse}
   */
  function getUrl(collectionName, options){
    var pathname = resolvePath(collectionName, options),
        o = _.extend({}, connection, {pathname: pathname, query: (options && options.where ? options.where : {})});
    return url.format(o);
  }

  /**
   * Create a connection object
   * @param collection collection object from Waterline ORM
   * @returns {{protocol: (*|string|req.protocol|string|string), hostname: (string|config.host|request.host|Request.request.host|req.host|host|string), port: (*|number|config.port|request.port|OPTIONS.port|request.port|req.port|request.port|request.port|creq.port|Request.request.port|Function|string|number|number|Request.url.port), pathname: (*|string|config.pathname|pathname|string)}}
   */
  function createConnection(collection){
    defs[collection.identity] = collection.definition;
    if(collection.config.cache){
      cache = collection.config.cache;
    }
    var c = _.extend({}, collection.defaults, collection.config);
    return {
      protocol: c.protocol,
      hostname: c.host,
      port: c.port,
      pathname: c.pathname
    };
  }

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
    var d = (data['objects'] || data['results'] || data),
        a = _.isArray(d) ? d : [d];
    return formatResults(a, collectionName);
  }

  // Adapter
  var adapter = {

    syncable: false,

    defaults: {
      host: 'localhost',
      port: 80,
      protocol: 'http',
      pathname: ''
    },

    registerCollection: function(collection, cb) {
      connection = createConnection(collection);
      cb();
    },

    create: function(collectionName, values, cb) {
      var uri = getUrl(collectionName);
      rest.post(uri, {data: values}).on('success', function(data, response){
        if(cache){
          cache.engine.del(uri);
        }
        cb(null, formatResult(data, collectionName));
      }).on('error', function(err, response){
        cb(err, response);
      });
    },

    find: function(collectionName, options, cb){
      var uri = getUrl(collectionName, options);
      var r = cache && cache.engine.get(uri);
      if(r){
        cb(null, r);
      } else {
        rest.get(uri).on('success', function(data, response){
          var r = getResultsAsCollection(data, collectionName);
          if(cache){
            cache.engine.set(uri, r);
          }
          cb(null, r);
        }).on('error', function(err, response){
          cb(err, response);
        });
      }
    },

    update: function(collectionName, options, values, cb) {
      var uri = getUrl(collectionName, options);
      rest.put(uri, {data: values}).on('success', function(data, response){
        if(cache){
          cache.engine.del(uri);
        }
        cb(null, getResultsAsCollection(data, collectionName));
      }).on('error', function(err, response){
        cb(err, response);
      });
    },

    destroy: function(collectionName, options, cb) {
      var uri = getUrl(collectionName, options);
      rest.delete(uri).on('success', function(data, response){
        cb();
      }).on('error', function(err, response){
        cb(err);
      });
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