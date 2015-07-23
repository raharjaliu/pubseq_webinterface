var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var exec = require('child_process').exec;

// defines default path
app.use(express.static(path.join(__dirname, 'public')));

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

  console.log('PubSeq app listening at http://%s:%s', host, port)
});

// GET handler for '/'
app.get('/', function(req, res) {
  console.log("GET requested at '/'");
  res.render('index', {
    title: 'PubSeq - Search'
  });
});

// POST handler for '/'
app.post('/', function(req, res) {

  exec('touch blast/test.in', function(error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
        console.log('exec error: ' + error);
    }
  });

  // TODO BLASTING the sequence starts here

  var solrQueryComplete = 'http://localhost:8983/solr/pubseq/select?wt=json&indent=true&q=' + 
                          req.body.query + 
                          '&sort=pubdate+desc%2Cpmid+desc%2c&rows%2Cpmid+desc=10&cursorMark=' +
                          req.body.cursorMark;
  var solrResponse = {};
  solrResponse['query'] = req.body.query;

  console.log(solrQueryComplete);

  http.get(
    solrQueryComplete,
    function(resp) {

      console.log('Got response from Solr index');
      var dataStr = '';

      resp.on("data", function(chunk) {

        // 0 indicates success
        solrResponse['status'] = 0;

        dataStr += chunk;
      });

      resp.on('end', function () {

        //console.log(dataStr);

        var resObj = JSON.parse(dataStr);
        solrResponse['respBody'] = resObj;
        res.json(solrResponse);

      });

    }).on('error', function(e){

      console.log('Got error from Solr index');
      // any status > 0 indicates failure
      solrResponse['status'] = 1;
      //console.log(e);
      res.json(solrResponse);
    });
});

// GET handler for '/about'
app.get('/about', function(req, res) {
  console.log("GET requested at '/about'");
  res.render('about', {
    title: 'About PubSeq'
  });
});

// GET handler for '/contact'
app.get('/contact', function(req, res) {
  console.log("GET requested at '/contact'");
  res.render('contact', {
    title: 'PubSeq - Drop me a message!'
  });
});

// GET handler for '/results'
app.get('/results', function(req, res) {
  console.log("GET requested at '/results'");
  res.render('results', {
    title: 'PubSeq - Drop me a message!'
  });
});

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