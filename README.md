![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png) 

# SailsRest

Sails.js Waterline adapter for REST APIs

## Installation

Install from NPM.

```bash
$ npm install sails-rest
```

## Compatibility

sails-rest is compatible with Sails.js v0.9.0 and above.

## Sails Configuration

Add the following config to the config/adapters.js file:

```javascript
module.exports.adapters = {

  default: 'rest',

  rest: {
    module: 'sails-rest',
    type: 'json',             // expected response type (json | string | http)
    host: 'api.somewhere.io', // api host
    port: 80,                 // api port
    protocol: 'http',         // HTTP protocol (http | https)
    pathname: '/api/v1'       // base api path
    resource: null,           // resource path to use (overrides model name)
    action: null,             // action to use for the given resource ([resource]/run)
    query: {},                // query parameters to provide with all GET requests
    methods: {                // overrides default HTTP methods used for each CRUD action
      create: 'post',
      find: 'get',
      update: 'put',
      destroy: 'del'
    },
    beforeFormatResult: function(result){return result},    // alter result prior to formatting
    afterFormatResult: function(result){return result},     // alter result after formatting
    beforeFormatResults: function(results){return results}, // alter results prior to formatting
    afterFormatResults: function(results){return results},  // alter results after formatting
    cache: {                  // optional cache engine
      engine : require('someCacheEngine')
    }
  }

};
```

## Caching

To cache API responses, you can add an object to the adapter's configuration with an attribute named `engine` that responds
to the following methods:

* `get(key)` - get cache key
* `set(key, value)` - set value on key
* `del(key)` - delete value identified by `key` from cache

An example caching configuration using LRU cache (`npm install --save lru-cache`) will look something like:

```javascript
// under config/cache.js

var LRU = require("lru-cache"),
    options = {
      max: 500,
      maxAge: 1000 * 10
    },
    cache = LRU(options);
module.exports = cache;

// under config/adapters.js

  rest: {
    module   : 'sails-rest',
    cache    : {
      engine : require('./cache')
    }
  }
```

Cache keys are computed from the API request URLs. This means that each unique URL will have its own cache key.

At the moment, cache busting is done by exact key only. This means that if you fetch `/users` and then update
`/users/1`, the cached objects under `/users` will not be purged to reflect your changes.

## TODO

* Improve cache busting
* Add support for async cache engines (eg. redis_client)
* Some create tests currently fail