var Connection = {},
    url = require('url'),
    _ = require('lodash'),
    request = require('superagent');

/**
 * Run all hook functions defined on `connection.hooks.before`.
 * Used to modify request properties before running the actual request.
 * Creates a SuperAgent Request object as soon as `config.endpoint` is defined by one of the hooks.
 *
 * @note When using your own hooks, please ensure the first hook in the chain defines `config.endpoint` properly, so
 *       SuperAgent Request object can be initialized with the correct HTTP endpoint.
 *
 * @param {Request} req - SuperAgent HTTP Request object
 * @param {String}  method - The model method
 * @param {Object}  config - configuration object used to hold request-specific configuration. this is used to avoid polluting the connection's own configuration object.
 * @param {Object}  conn - connection configuration object:
 *    - {Object} connection - Waterline connection configuration object
 *    - {String} collection - collection name. appended to API pathname.
 *                            For example, given the api `http://localhost:8080/api/v1`,
 *                            a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
 *    - {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
 *    - {Array<Object>} values - values of records to create.
 * @return {Request} - SuperAgent Request object
 */
function runBeforeHooks(req, method, config, conn){
  var httpMethod = conn.connection.methods[method];
  
  conn.connection.hooks.before.forEach(function (hook) {
    hook(req, httpMethod, config, conn);
    if(!_.isEmpty(config.endpoint) && typeof req === 'undefined'){
      req = request[httpMethod](config.endpoint);
      setRequestHeaders(conn.connection, req);
    }
  });
  return req;
}

/**
 * Run all hook functions defined on `connection.hooks.after`.
 * Used to modify the response object and optionally handle any relevant errors if any.
 * @param {Object} connection - connection configuration object
 * @param {Error} err - response error object
 * @param {Response} res - SuperAgent HTTP Response object
 */
function runAfterHooks(connection, err, res){
  connection.hooks.after.forEach(function (hook) {
    hook(err, res);
  });
}

/**
 * Sets headers on request object before issuing an HTTP request.
 * @param {Object} connection - Waterline connection configuration object
 * @param {Request} req - SuperAgent HTTP Request object
 */
function setRequestHeaders(connection, req) {
  if(_.isObject(connection.headers)){
    req.set(connection.headers);
  }
}

/**
 * Handle SuperAgent HTTP Response. Calls hook functions followed by Waterline callback.
 * @param {Object} connection - connection configuration object
 * @param {Error} err - response error object
 * @param {Response} res - SuperAgent HTTP Response object
 * @param {Function} cb - function to call with query results.
 */
function handleResponse(connection, err, res, cb) {
  runAfterHooks(connection, err, res);
  cb(err, res.body);
}

/**
 * Creates a generic, anonymous HTTP response handler to handle SuperAgent responses.
 * @param {Object} connection - Waterline connection configuration object
 * @param {Function} cb - function to call with query results.
 * @returns {Function} SuperAgent response handler
 */
function getResponseHandler(connection, cb) {
  return function (err, res) {
    handleResponse(connection, err, res, cb);
  }
}

/**
 * Find record(s) by issuing an HTTP GET request.
 * @param {Object} connection - connection configuration object
 * @param {String} collection - collection name. appended to API pathname.
 *                              For example, given the api `http://localhost:8080/api/v1`,
 *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
 * @param {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
 * @param {Function} cb - function to call with query results.
 * @returns {Request}
 */
Connection.find = function (connection, collection, options, cb) {
  var config = {},
      req,
      conn = {
        connection: connection,
        collection: collection,
        options: options,
        values: {}
      };
  req = runBeforeHooks(req, 'find', config, conn);
  return req.query(conn.options).end(function (err, res) {
    // Waterline requires that `find` will return an array.
    // Here we ensure that response body is converted to an array if required.
    if(!err && !_.isEmpty(res.body)){
      if(!Array.isArray(res.body)){
        res.body = [res.body];
      }
    }
    handleResponse(conn.connection, err, res, cb);
  });
};

/**
 * Create record(s) by issuing an HTTP POST request
 * @param {Object} connection - connection configuration object
 * @param {String} collection - collection name. appended to API pathname.
 *                              For example, given the api `http://localhost:8080/api/v1`,
 *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
 * @param {Array<Object>} values - values of records to create.
 * @param {Function} cb - function to call with query results.
 * @returns {Request}
 */
Connection.create = function (connection, collection, values, cb) {
  var config = {},
    req,
    conn = {
      connection: connection,
      collection: collection,
      options: {},
      values: values
    };
  req = runBeforeHooks(req, 'create', config, conn);
  return req.send(conn.values).end(getResponseHandler(conn.connection, cb));
};

/**
 * Update record(s) by issuing an HTTP PUT request.
 * @param {Object} connection - connection configuration object
 * @param {String} collection - collection name. appended to API pathname.
 *                              For example, given the api `http://localhost:8080/api/v1`,
 *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
 * @param {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
 * @param {Array<Object>} values - values of records to create.
 * @param {Function} cb - function to call with query results.
 * @returns {Request}
 */
Connection.update = function (connection, collection, options, values, cb) {
  var config = {},
    req,
    conn = {
      connection: connection,
      collection: collection,
      options: options,
      values: values
    };
  req = runBeforeHooks(req, 'update', config, conn);

  return req.query(conn.options).send(conn.values).end(getResponseHandler(conn.connection, cb));
};

/**
 * Destroy record(s) by issuing an HTTP DELETE request.
 * @param {Object} connection - connection configuration object
 * @param {String} collection - collection name. appended to API pathname.
 *                              For example, given the api `http://localhost:8080/api/v1`,
 *                              a collection named `user` will resolve to `http://localhost:8080/api/v1/user`.
 * @param {Object} options - query options object. contains query conditions (`where`), sort, limit etc. as per Waterline's API.
 * @param {Function} cb - function to call with query results.
 * @returns {Request}
 */
Connection.destroy = function (connection, collection, options, cb) {
  var config = {},
    req,
    conn = {
      connection: connection,
      collection: collection,
      options: options,
      values: {}
    };
  req = runBeforeHooks(req, 'destroy', config, conn);
  return req.query(conn.options).end(getResponseHandler(conn.connection, cb));
};

module.exports = Connection;