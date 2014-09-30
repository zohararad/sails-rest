var express = require('express'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    app = express(),
    sys = require('sys'),
    _ = require('lodash');

var Models = {},
    ids = {};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

app.get('/api/v1/:collection', function(req, res){
  var collection = req.params.collection,
      id = parseInt(req.params.id, 10),
      query = _.isEmpty(req.query) ? null : req.query,
      r = [];

  if (!_.isEmpty(query)) {
    _.each(query, function(param, key) {
      query[key] = decodeURIComponent(param);
    });
  }

  if (Models[collection]) {
    r = _.filter(Models[collection], query);
  }

  res.json(r);
});

app.get('/api/v1/:collection/:id', function(req, res){
  var collection = req.params.collection,
      id = parseInt(req.params.id, 10),
      query = {id: id},
      r = {};

  if (Models[collection]) {
    r = _.find(Models[collection], query);
  }

  res.json(r);
});

app.post('/api/v1/:collection', function(req, res){
  var collection = req.params.collection,
      r = {};

  if (!Models[collection]) {
    Models[collection] = [];
    ids[collection] = 0;
  }

  Model = Models[collection];

  ids[collection]++;

  id = ids[collection];

  r = _.cloneDeep(req.body);
  r.id = id;
  r.createdAt = r.updatedAt = new Date();

  Model.push(r);

  res.json(r);
});

app.put('/api/v1/:collection/:id', function(req, res){
  var collection = req.params.collection,
      id = parseInt(req.params.id, 10),
      query = {id: id},
      r = {};

  if (Models[collection]) {
    r = _.find(Models[collection], query);

    _.extend(r, req.body, {updatedAt: new Date()});
  }

  res.json(r);
});

app.delete('/api/v1/:collection/:id', function(req, res){
  var collection = req.params.collection,
      id = parseInt(req.params.id, 10),
      query = {id: id},
      r = {};

  if (Models[collection]) {
    r = _.find(Models[collection], query);

    var index = _.indexOf(Models[collection], r);

    if (index > -1) {
      Models[collection].splice(index, 1);
    }
  }

  res.json(r);
});

module.exports = app;