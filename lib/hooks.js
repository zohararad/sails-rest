var url = require('url'),
    _ = require('lodash'),
    iso = /^(\d{4})(?:-?W(\d+)(?:-?(\d+)D?)?|(?:-(\d+))?-(\d+))(?:[T ](\d+):(\d+)(?::(\d+)(?:\.(\d+))?)?)?(?:Z(-?\d*))?$/;

/**
 * Cleans query options object from Waterline-specific `where` object, by moving `where` values to main query options object.
 * For example, given the query options object `{where:{firstName: "Tedd"}, limit: 1}, this function will modify the query options
 * object to {firstName: "Tedd", limit: 1}
 *
 * @param {Request} req - SuperAgent HTTP Request object
 * @param {String}  method - HTTP request method
 * @param {Object}  config - configuration object used to hold request-specific configuration. this is used to avoid polluting the connection's own configuration object.
 * @param {Object}  conn - connection configuration object:
 *    - {Object} connection - Waterline connection configuration object
 *    - {String} collection - collection name. appended to API pathname.
 *                            For example, given the api `http://localhost:8080/api/v1`,
 *                            a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
 *    - {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
 *    - {Array<Object>} values - values of records to create.
 * @param {Function} cb - function that is called when this hook finishes
 */
function removeWhereFromQuery(req, method, config, conn, cb){
  var query = {};
  if(_.isObject(conn.options) && conn.options.hasOwnProperty('where')){
    query = conn.options.where;
    delete conn.options.where;
    conn.options = _.merge(conn.options, query);
  }
  cb();
}

/**
 * Createn an HTTP request URL from connection configuration, collection name and query options object.
 * If query options object contains an `id` field, the HTTP URL will be formatted as proto://pathname/collection/id.
 * Otherwise the HTTP URL will be formatted as proto://pathname/collection.
 *
 * @param {Request} req - SuperAgent HTTP Request object
 * @param {String}  method - HTTP request method
 * @param {Object}  config - configuration object used to hold request-specific configuration. this is used to avoid polluting the connection's own configuration object.
 * @param {Object}  conn - connection configuration object:
 *    - {Object} connection - Waterline connection configuration object
 *    - {String} collection - collection name. appended to API pathname.
 *                            For example, given the api `http://localhost:8080/api/v1`,
 *                            a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
 *    - {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
 *    - {Array<Object>} values - values of records to create.
 * @param {Function} cb - function that is called when this hook finishes
 */
function createEndpoint(req, method, config, conn, cb){
  if(_.isObject(conn.options) && conn.options.hasOwnProperty('id')){
    config.endpoint = url.resolve(conn.connection.endpoint + '/', conn.collection + '/' + conn.options.id);
    delete conn.options.id;
  } else {
    config.endpoint = url.resolve(conn.connection.endpoint + '/', conn.collection);
  }
  cb();
}

/**
 * Convert ISO formatted strings on response object into Javascript Date objects.
 * Used to cast date fields returned from HTTP response into their correct Date type.
 * @param {Object} record - response record object to process.
 */
function castRecordDateFields(record) {
  _.forEach(record, function (value, key) {
    if(_.isString(value) && iso.test(value)){
      record[key] = new Date(value);
    }
  });
}

/**
 * Process HTTP response. Converts response objects date fields from Strings to Dates.
 * @param {Error} err - HTTP response error
 * @param {Response} res - SuperAgent HTTP Response object
 * @param {Function} cb - function that is called when this hook finishes
 */
function processResponse(err, res, cb){
  if(!err) {
    if(Array.isArray(res.body)){
      res.body.forEach(function (body) {
        castRecordDateFields(body);
      });
    } else if (_.isObject(res.body)) {
      castRecordDateFields(res.body);
    }
  }
  cb();
}

module.exports = {
  before: [removeWhereFromQuery, createEndpoint],
  after: [processResponse]
};