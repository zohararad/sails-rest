var request = require('superagent'),
    url = require('url');
/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  connection: 'rest',
  attributes: {
    firstName: 'string',
    lastName: 'string'
  },
  /**
   * Send an arbitrary GET query to REST backend
   * @param path request path
   * @param query request query-string object `{paramA: "valueA"}`
   * @param cb request end callback. See https://github.com/visionmedia/superagent
   */
  query: function (path, query, cb) {
    var httpMethod = 'get',
        config = User.datastore.config,
        endpoint = url.format({
                    host: config.host,
                    pathname: path,
                    protocol: config.protocol,
                    query: query
                  }),
        req = request[httpMethod](endpoint);
    req.end(cb);
  }
};
