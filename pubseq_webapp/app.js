var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');

// enables POST body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// defines views and view format
app.set('views', './views');
app.set('view engine', 'jade');

// defines server
var server = app.listen(3000, function() {

  console.log(server.address());

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port)
});

// GET handler for '/'
app.get('/', function(req, res) {
  //res.header('Content-Type', 'application/json; charset=utf-8');
  res.render('index', {
    title: 'PubSeq - Search'
  });
});

// POST handler for '/'
app.post('/', function(req, res) {
  console.log('POST!');
  console.log(req.body);

  // TODO BLASTING the sequence starts here

  var solrResponse;

  // TODO queries Solr index
  http.get(
    "http://localhost:8983/solr/pubseq/select?wt=json&indent=true&q=*:*",
    function(res) {
      console.log('got response');

      res.on("data", function(chunk) {
        console.log("BODY: " + chunk);

        // the response would then be returned back to client
      });

    }).on('error', function(e){
      console.log('got error');
      //console.log(e);
    });

    console.log("Solr response is");
    console.log(solrResponse);

  res.send(req.body);
});

// GET handler for '/about'
app.get('/about', function(req, res) {
  res.render('about', {
    title: 'About PubSeq'
  });
});

// GET handler for '/contact'
app.get('/contact', function(req, res) {
  res.render('contact', {
    title: 'PubSeq - Drop me a message!'
  });
});

// GET handler for '/results'
app.get('/results', function(req, res) {
  res.render('results', {
    title: 'PubSeq - Drop me a message!'
  });
});

// default implementation from express-generator
/*
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
*/