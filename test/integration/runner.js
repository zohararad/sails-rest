var tests = require('waterline-adapter-tests'),
    adapter = require('../../SailsRest'),
    mocha = require('mocha'),
    app = require('../support/app');

var config = {
  host: 'localhost',
  port: 3000,
  pathname: '/api/v1'
};

app.listen(3000);
var suite = new tests({ adapter: adapter, config: config });