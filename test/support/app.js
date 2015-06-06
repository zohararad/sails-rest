var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    app = express(),
    sys = require('sys'),
    _ = require('lodash'),
    Database = require('sails-memory/lib/database');

var memory = new Database();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

function prepareQuery(query){
  var result = {},
      keys = Object.keys(query);

  _.each(keys, function (key) {
    var value = query[key];

    try{
      query[key] = JSON.parse(value);
    } catch(e) {
      query[key] = value;
    }
  });

  ['skip', 'limit', 'offset'].forEach(function(key){
    if(query[key] !== undefined){
      result[key] = query[key];
      delete query[key];
    }
  });

  result.where = query;
  return result;
}

function ensureCollection(name, cb) {
    memory.registerCollection(name, {
      definition: {
        id: {
          type: 'integer',
          autoIncrement: true
        }
      }
    }, cb);
}

app.get('/api/v1/:collection', function(req, res){
  var collection = req.params.collection,
      query = _.isEmpty(req.query) ? {} : prepareQuery(req.query);

  ensureCollection(collection, function () {
    memory.select(collection, query, function (err, data) {
      res.json(data);
    });
  });
});

app.get('/api/v1/:collection/:id', function(req, res){
  var collection = req.params.collection,
      id = parseInt(req.params.id, 10),
      query = {id: id};

  ensureCollection(collection, function () {
    memory.select(collection, { where: query }, function (err, data) {
      res.json(data);
    });
  });
});

app.post('/api/v1/:collection', function(req, res){
  var collection = req.params.collection;

  ensureCollection(collection, function () {
    memory.insert(collection, req.body, function (err, data) {
      res.json(data);
    });
  });
});

app.put('/api/v1/:collection/:id', function(req, res){
  var collection = req.params.collection,
      id = parseInt(req.params.id, 10),
      query = {id: id};

  ensureCollection(collection, function () {
    memory.update(collection, query, req.body, function (err, data) {
      res.json(data);
    });
  });
});

app.put('/api/v1/:collection', function(req, res){
  var collection = req.params.collection;

  ensureCollection(collection, function () {
    memory.update(collection, {}, req.body, function (err, data) {
      res.json(data);
    });
  });
});

app.delete('/api/v1/:collection', function(req, res){
  var collection = req.params.collection;

  ensureCollection(collection, function () {
    memory.dropCollection(collection, function (err, data) {
      res.json(data);
    });
  });
});

app.delete('/api/v1/:collection/:id', function(req, res){
  var collection = req.params.collection,
      id = parseInt(req.params.id, 10),
      query = { where: { id: id} };

  ensureCollection(collection, function () {
    memory.destroy(collection, query, function (err, data) {
      res.json(data);
    });
  });
});

module.exports = app;
