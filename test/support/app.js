var express = require('express'),
    multer = require('multer'),
    bodyParser = require('body-parser'),
    app = express(),
    _ = require('lodash'),
    log = new (require('captains-log'))(),
    Database = require('sails-memory/lib/database');

var memory = new Database();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

function prepareQuery(query){
  var where = {},
      result = {},
      extras = ['skip', 'limit', 'offset', 'sort'],
      keys = Object.keys(query);

  _.each(keys, function (key) {
    var value;
    try{
      value = JSON.parse(query[key]);
    } catch(e) {
      value = query[key];
    }

    if(extras.indexOf(key) > -1) {
      result[key] = value;
    } else {
      where[key] = value;
    }

    try{
      query[key] = JSON.parse(value);
    } catch(e) {
      query[key] = value;
    }
  });

  result.where = where;
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
      query = _.isEmpty(req.query) ? {where:{}} : prepareQuery(req.query);

  query.where.id = parseInt(req.params.id, 10);

  ensureCollection(collection, function () {
    memory.select(collection, query, function (err, data) {
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
      query = _.isEmpty(req.query) ? {where:{}} : prepareQuery(req.query);

  query.where.id = parseInt(req.params.id, 10);

  ensureCollection(collection, function () {
    memory.update(collection, query, req.body, function (err, data) {
      res.json(data);
    });
  });
});

app.put('/api/v1/:collection', function(req, res){
  var collection = req.params.collection,
      query = _.isEmpty(req.query) ? {where:{}} : prepareQuery(req.query);

  ensureCollection(collection, function () {
    memory.update(collection, query, req.body, function (err, data) {
      res.json(data);
    });
  });
});

app.delete('/api/v1/:collection', function(req, res){
  var collection = req.params.collection,
      query = _.isEmpty(req.query) ? {where:{}} : prepareQuery(req.query);

  ensureCollection(collection, function () {
    if(Object.keys(query).length > 0) {
      memory.destroy(collection, query, function (err, data) {
        res.json(data);
      });
    } else {
      memory.dropCollection(collection, function (err, data) {
        res.json(data);
      });
    }
  });
});

app.delete('/api/v1/:collection/:id', function(req, res){
  var collection = req.params.collection,
      query = _.isEmpty(req.query) ? {where:{}} : prepareQuery(req.query);

  query.where.id = parseInt(req.params.id, 10);

  ensureCollection(collection, function () {
    memory.destroy(collection, query, function (err, data) {
      res.json(data);
    });
  });
});

module.exports = app;
