/**
 * For Sails.js v0.10
 */
module.exports.connections = {

  usersRest: {
    adapter: 'sails-rest',
    type: 'json',                   // expected response type (json | string | http)
    host: 'api.myapplication.com',  // api host
    port: 80,                       // api port
    protocol: 'http',               // HTTP protocol (http | https)
    pathname: '/api/v1',            // base api path
    resource: 'users',              // resource path to use (overrides model name)
    action: null,                   // action to use for the given resource ([resource]/run)
    methods: {                      // overrides default HTTP methods used for each CRUD action
      create: 'post',
      find: 'get',
      update: 'put',
      destroy: 'del'
    }
  }

};




