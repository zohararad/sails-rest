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

For Sails.js v0.9 please use v0.0.3 version of sails-rest.
 
For Sails.js v0.10 please use v0.0.4 version of sails-rest (or newer).

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
    rejectUnauthorized: true, // prevent https connections that use a self-signed certificate
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

## Change Log

### v0.0.3

* Fixing issue where only a single set of connection settings were stored, not separate settings for each model.
* Updating restler dependency to latest version.
* Adhering to JSHint object dot notation reccomendation.
* Making cache configurable per collection.
* Reworking how requests are made. Now using a single method for making the request. Also allowing for specification of the method for each type of request and allowing overrides/defaults for resource action and query in the url.
* Fixing error handling conditional.
* Fixing issue with cloning of connection.
* Fixing improper methodName and restMethod.
* Allowing for destroying all items in collection as well as by query, instead of only id.
* Expanding test application to better suit suite of Waterline tests.
* Reworking result formatting.
* Referencing GitHub repo for reslter due to bugs that cause errors with tests.
* Decoding URL compontents for test support application.
* Absstracting logic to allow for deletion and updates of multiple items.
* Removing unused variable.
* Converting REST client from "restler" to "restify" due to bugs with restler module.
* Adding method to modify result before and after format and fixing formatResults method.
* Allowing for formatting before and after both individual results and all results.
* Expecting return value for result formatting functions.
* Modifying README to reflect new config options.
* Modifying README formatting to allow for better legibility on GitHub page.
* Removing redundant config.

## Contributors

[Christopher M. Mitchell](https://github.com/divThis)

## MIT License

Copyright (c) 2013 Zohar Arad

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
