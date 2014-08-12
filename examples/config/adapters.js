/**
 * For Sails.js v0.9
 */

module.exports.adapters = {

  moviesRest: {
    module: 'sails-rest',
    type: 'json',                   // expected response type (json | string | http)
    host: 'api.myapplication.com',  // api host
    port: 80,                       // api port
    protocol: 'http',               // HTTP protocol (http | https)
    pathname: '/api/v1',            // base api path
    methods: {                      // overrides default HTTP methods used for each CRUD action
      create: 'post',
      find: 'get',
      update: 'put',
      destroy: 'del'
    }
  }

};