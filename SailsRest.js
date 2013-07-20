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

  var connection = {};

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

    create: function(collectionName, data, cb) {
      var uri = getUrl(collectionName);
      rest.post(uri, {data: data}).on('complete', function(data, response){
        onRestComplete(data, response, cb);
      });
    },

    find: function(collectionName, options, cb){
      var uri = getUrl(collectionName, options);
      rest.get(uri).on('complete', function(data, response){
        onRestComplete(data, response, cb);
      });
    },

    update: function(collectionName, options, values, cb) {
      var uri = getUrl(collectionName, options);
      rest.put(uri, {data: values}).on('complete', function(data, response){
        onRestComplete(data, response, cb);
      });
    },

    destroy: function(collectionName, options, cb) {
      var uri = getUrl(collectionName, options);
      rest.delete(uri).on('complete', function(data, response){
        onRestComplete(data, response, cb);
      });
    },

    drop: function(collectionName, cb) {
      cb();
    }
  };

  function onRestComplete(data, response, cb){
    if(response.statusCode === 200 || response.statusCode === 201){
      var d = (data['objects'] || data['results'] || data),
          a = _.isArray(d) ? d : [d];
      console.log("#################################", a);
      cb(null, a);
    }
  }

  function getUrl(collectionName, options){
    var pathname = resolvePath(collectionName, options),
        o = _.extend({}, connection, {pathname: pathname, query: (options && options.where ? options.where : {})});
    return url.format(o);
  }

  function resolvePath(collectionName, options){
    var pathname = connection.pathname + '/' + collectionName;
    if(options && options.where && options.where.id){
      pathname += '/'+ options.where.id;
      delete options.where.id;
    }
    return pathname;
  }

  function createConnection(collection){
    var c = _.extend({}, collection.defaults,collection.config);
    return {
      protocol: c.protocol,
      hostname: c.host,
      port: c.port,
      pathname: c.pathname
    };
  }

  return adapter;
}());