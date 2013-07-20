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
    module   : 'sails-rest',
    hostname : 'api.somewhere.io', // api hostname
    port     : 80,                 // api port
    protocol : 'http',             // HTTP protocol (http | https)
    pathname : '/api/v1'           // base api path
  }

};
```

## TODO

* Add some sort of caching support
* Some create tests currently fail