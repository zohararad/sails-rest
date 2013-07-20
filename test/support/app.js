var express = require('express'),
    app = express(),
    sys = require('sys'),
    _ = require('lodash');

var Models = {},
    id = 1;

app.use(express.bodyParser({}));

app.get('/api/v1/:collection', function(req, res){
  res.json(_.values(Models));
});

app.get('/api/v1/:collection/:id', function(req, res){
  res.json(Models[params.id]);
});

app.post('/api/v1/:collection', function(req, res){
  Model = req.body;
  Model.id = id;
  Model.createdAt = Model.updatedAt = new Date();
  id += 1;
  Models[id.toString()] = Model;
  res.json(Model);
});

app.put('/api/v1/:collection/:id', function(req, res){
  Model = Models[params.id];
  Model = _.extend(Model, req.body);
  Model.updatedAt = new Date();
  res.json(Model);
});

app.delete('/api/v1/:collection/:id', function(req, res){
  Model = Models[params.id];
  delete Models[params.id];
  res.json(Model);
});

module.exports = app;