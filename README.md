![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)

# waterline-rest

Provides easy access to RESTful APIs from Sails.js & Waterline.

This module is a Waterline/Sails adapter, an early implementation of a rapidly-developing, tool-agnostic data standard.  Its goal is to provide a set of declarative interfaces, conventions, and best-practices for integrating with all sorts of data sources.  Not just databases-- external APIs, proprietary web services, or even hardware.

Strict adherence to an adapter specification enables the (re)use of built-in generic test suites, standardized documentation, reasonable expectations around the API for your users, and overall, a more pleasant development experience for everyone.

## Compatibility

> `sails-rest` version 0.1.x is **not** backwards compatible with 0.0.x . In fact, version 0.1.x is a complete rewrite of the adapter and is compatible with Waterline 0.10.x and above.

### Installation

To install this adapter, run:

```sh
$ npm install sails-rest
```

### Configuration

Add the following config to the `config/connections.js` file:

```javascript
module.exports.connections = {

  rest: {
    adapter: 'sails-rest',
    host:     'localhost:8080',  // api host
    protocol: 'http',            // api HTTP protocol
    pathname: ''                 // api endpoint path name
    headers:  {},                // Optional HTTP headers    
    hooks: {
      merge:    true,            // flag that indicates whether or not to merge build-in hooks with user-provided hooks
      before:   [],              // array of hook functions that run before a request
      after:    []               // array of hook functions that run after a request
    }
  }

};
```

### Hooks

`sails-rest` supports defining *before* and *after* hooks that are executed before and after issuing an HTTP request respectively.
Hooks are simply functions that conform to a specific signature and are run in sequence, allowing you to transform various parts of the request
and response flow.

Since REST APIs have various and individual implementations, hooks are `sails-rest`'s way of letting the developer 
add custom logic to API calls without polluting the adapter's code.

#### before hooks

Before hooks will run in sequence before issuing an HTTP request and are defined in the `hooks.before` array on the configuration object.

Each hook must conform to the following signature:

```javascript

/**
 * @param {Request} req - SuperAgent HTTP Request object
 * @param {String}  method - HTTP request method
 * @param {Object}  config - configuration object used to hold request-specific configuration. this is used to avoid polluting the connection's own configuration object.
 * @param {Object}  conn - connection configuration object:
 *    - {Object} connection - Waterline connection configuration object
 *    - {String} collection - collection name.
 *    - {Object} options - query options object. contains Waterline query conditions (where), sort, limit etc. as per Waterline's API.
 *    - {Array<Object>} values - values of records to create.
 */
function someBeforeHook(req, method, config, conn){
  // add custom logic here
}
```

> #### Important!
> If you choose not to merge the built-in hooks with your own hooks, you must provide a hook that creates an `endpoint` field on the `config` object. This field is used to resolve the HTTP request end-point.

#### after hooks

Before hooks will run in sequence after the HTTP request ends and are defined in the `hooks.after` array on the configuration object.

Each hook must conform to the following signature:

```javascript
/**
 * Process HTTP response. Converts response objects date fields from Strings to Dates.
 * @param {Error} err - HTTP response error
 * @param {Response} res - SuperAgent HTTP Response object
 */
function someAfterHook(err, res){
  // add custom logic here
}
```

#### Build-in hooks

`sails-rest` comes in with two built-in *before* hooks and one build-in *after* hook.

##### before hook - HTTP end-point builder

This hook build the final HTTP endpoint from your host, protocol and pathname configurations, along with
the collection name on which the adapter is configured, and optionally the record ID.

Given the default adapter host, scheme and pathname configuration, and a model named `user`, this hook will create the following HTTP endpoints:

+ `find()` - http://localhost:8080/user
+ `find(id)` - http://localhost:8080/user/:id
+ `create()` - http://localhost:8080/user
+ `update()` - http://localhost:8080/user
+ `update(id)` - http://localhost:8080/user/:id
+ `delete()` - http://localhost:8080/user
+ `delete(id)` - http://localhost:8080/user/:id

##### before hook - Query options cleaner

This hook removes the `where` object added by Waterline from request query options, and adds that object fields to the main options object.

Given the query options object `{where: {first_name: "Tedd"}, sort: {first_name: 1}}`, this hook will modify the query options object to: `{first_name: "Tedd", sort: {first_name: 1}}`.

This behaviour is useful and probably desired since most APIs are not likely to "understand" Waterline's query jargon.

##### after hook - response Date fields formatting

This hook iterates over HTTP response objects and looks for ISO formatted date strings on response object fields. If found,
this fields will be converted into Javascript Date objects.

#### merging hooks

The adapter's configuration allows you to specify whether you wish to merge your own hooks with the above built-in hooks or not, by setting the `hooks.merge` flag to either `true` or `false`.

If you choose not to use the above built-in hooks, please make sure that the first `before` hook you supply creates an `endpoint` field on the `config` object, which points to the HTTP endpoint you wish
to issue requests against.

If you're unsure, please take a look at the `createEndpoint` function inside [lib/hooks.js](./lib/hooks.js)

### Interfaces

This adapter implements the [semantic](https://github.com/balderdashy/sails-docs/blob/master/contributing/adapter-specification.md#semantic-interface) interface and exposes the following methods:
                                                                                                                                                                 
###### `find()`

Find one or more records. Translated to an HTTP `GET` request.

###### `create()`

Create one or more records. Translated to an HTTP `POST` request.

###### `update()`

Update one or more records. Translated to an HTTP `PUT` request.

###### `destroy()`

Destroy one or more records. Translated to an HTTP `DELETE` request.

### Sails.js Resources

- [Stackoverflow](http://stackoverflow.com/questions/tagged/sails.js)
- [#sailsjs on Freenode](http://webchat.freenode.net/) (IRC channel)
- [Twitter](https://twitter.com/sailsjs)
- [Professional/enterprise](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#are-there-professional-support-options)
- [Tutorials](https://github.com/balderdashy/sails-docs/blob/master/FAQ.md#where-do-i-get-help)
- <a href="http://sailsjs.org" target="_blank" title="Node.js framework for building realtime APIs."><img src="https://github-camo.global.ssl.fastly.net/9e49073459ed4e0e2687b80eaf515d87b0da4a6b/687474703a2f2f62616c64657264617368792e6769746875622e696f2f7361696c732f696d616765732f6c6f676f2e706e67" width=60 alt="Sails.js logo (small)"/></a>

### License

**[MIT](./LICENSE)**

&copy; 2015 [Zohar Arad](http://github.com/zohararad)

&copy; 2014 [balderdashy](http://github.com/balderdashy) & [contributors]

[Mike McNeil](http://michaelmcneil.com), [Balderdash](http://balderdash.co) & contributors

[Sails](http://sailsjs.org) is free and open-source under the [MIT License](http://sails.mit-license.org/).

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/8acf2fc2ca0aca8a3018e355ad776ed7 "githalytics.com")](http://githalytics.com/balderdashy/waterline-rest/README.md)


