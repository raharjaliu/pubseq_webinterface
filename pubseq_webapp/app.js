var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var http = require('http');
var exec = require('child_process').exec;
var fs = require('fs');
var NodeCache = require("node-cache");

var app = express();
// init cache
var myCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 120
});

// defines default path
app.use(express.static(path.join(__dirname, 'public')));

// enables POST body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// defines views and view format
app.set('views', './views');
app.set('view engine', 'jade');

// Java-like hash code implementation. NOTE THAT
// this implementation slightly differs from Java
// one in the way that this implementation
// takes the absolute value of negative hash codes
String.prototype.absHashCode = function() {
  var hash = 0;
  if (this.length == 0) return hash;
  for (i = 0; i < this.length; i++) {
    char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// simple startsWith implementation for String.
// NOTE THAT according to newest ECMAScript 2015
// Standard (ES6) startsWith will be natively
// supported for string
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function(str) {
    return this.slice(0, str.length) == str;
  };
}

// logs execution and its corresponding properties (stdout, stderr, error) onto the server console
var logStoutSterrErr = function(exec, stout, sterr, err) {
  console.log('execution: ' + exec);
  console.log(' stdout: ' + stout);
  console.log(' stderr: ' + sterr);
  if (err !== null) {
    console.log(' exec error: ' + err);
  }
}

// Given list of UniProt IDs, create
// query in URI component format
var createQuery = function(listOfUPIDs) {

  var query = '';

  for (var i = 0; i < listOfUPIDs.length; i++) {
    if (i > 0) {
      query += ' OR ';
    }
    query += ('uniprotid:' + listOfUPIDs[i]);
  }
  query = encodeURIComponent(query);

  return query;
}

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

  var postResponse = {};

  if (req.body.mode === 'new') {

    // NEW mode
    console.log("NEW");

    var input = req.body.input;
    var content;
    var sequence;
    if (input.startsWith(">") || input.startsWith(";")) {
      sequence = input.split("\n")[1];
      content = input;
    } else {
      sequence = input;
      content = "> input_" + sequence.absHashCode() + "\n" + input;
    }
    console.log("input is ");
    console.log(input);
    console.log("sequence is ");
    console.log(sequence);
    console.log("content is");
    console.log(content);

    value = myCache.get(sequence);

    if (value == undefined) {

      // sequence is not contained in cache
      console.log("sequence is not contained in cache");

      var fileIn = sequence.absHashCode() + ".in";
      var fileOut = sequence.absHashCode() + ".out";
      var fileScript = 'blast_' + sequence.absHashCode() + ".sh";
      exec('pwd', function(error, stdout, stderr) {
        logStoutSterrErr('pwd', stdout, stderr, error);
        var pwd = stdout.trim();
        var createFile = "echo '" + content + "' > blast/" + fileIn;
        exec(createFile, function(error, stdout, stderr) {
          logStoutSterrErr(createFile, stdout, stderr, error);
          var chmodFile = 'chmod 775 blast/' + fileIn;
          exec(chmodFile, function(error, stdout, stderr) {
            logStoutSterrErr(chmodFile, stdout, stderr, error);
            var createScript = "echo 'blastpgp -a 24 -i " + pwd + "/blast/" + fileIn + " -d /mnt/project/rost_db/data/big/big -e 0.001 -o " + pwd + "/blast/" + fileOut + " -m 8' > blast/" + fileScript;
            exec(createScript, function(error, stdout, stderr) {
              logStoutSterrErr(createScript, stdout, stderr, error);
              var chmodScript = 'chmod 775 blast/' + fileScript;
              exec(chmodScript, function(error, stdout, stderr, error) {
                logStoutSterrErr(chmodScript, stdout, stderr, error);
                var qsubScript = 'sudo -u pubseq qsub blast/' + fileScript;
                exec(qsubScript, function(error, stdout, stderr, error) {
                  logStoutSterrErr(qsubScript, stdout, stderr, error);
                  postResponse['status'] = 'submitted';
                  postResponse['id'] = sequence.absHashCode();
                  postResponse['sequence'] = sequence;
                  res.json(postResponse);
                });
              });
            });
          });
        });
      });
    } else {

      console.log("sequence is contained in cache");
      // sequence is contained in cache

      var query = createQuery(value);
      var solrQueryComplete = 'http://localhost:8983/solr/pubseq/select?wt=json&indent=true&q=' +
        query +
        '&sort=pubdate+desc%2Cpmid+desc%2c&rows%2Cpmid+desc=10&cursorMark=*';
      postResponse['query'] = query;

      http.get(solrQueryComplete, function(resp) {

        console.log('Got response from Solr index');
        var dataStr = '';

        resp.on("data", function(chunk) {

          // 0 indicates success
          postResponse['solrStatus'] = 0;
          dataStr += chunk;

        });

        resp.on('end', function() {

          //console.log(dataStr);
          var resObj = JSON.parse(dataStr);
          postResponse['respBody'] = resObj;
          postResponse['status'] = 'done';

          res.json(postResponse);

        });

      }).on('error', function(e) {
        console.log('Got error from Solr index');
        // any status > 0 indicates failure
        postResponse['solrStatus'] = 1;
        //console.log(e);
        res.json(postResponse);
      });
    }

  } else {

    // if mode is not NEW, then mode is either UPDATE or CHECK

    var query;
    var cursorMark;

    if (req.body.mode === 'update') {

      // UPDATE mode
      console.log("UPDATE");

      query = req.body.query;
      cursorMark = req.body.cursorMark;

      var solrQueryComplete = 'http://localhost:8983/solr/pubseq/select?wt=json&indent=true&q=' +
        query +
        '&sort=pubdate+desc%2Cpmid+desc%2c&rows%2Cpmid+desc=10&cursorMark=' +
        cursorMark;
      postResponse['query'] = query;

      http.get(solrQueryComplete, function(resp) {

        console.log('Got response from Solr index');
        var dataStr = '';

        resp.on("data", function(chunk) {

          // 0 indicates success
          postResponse['solrStatus'] = 0;
          dataStr += chunk;

        });

        resp.on('end', function() {

          //console.log(dataStr);
          var resObj = JSON.parse(dataStr);
          postResponse['respBody'] = resObj;
          res.json(postResponse);

        });

      }).on('error', function(e) {
        console.log('Got error from Solr index');
        // any status > 0 indicates failure
        postResponse['solrStatus'] = 1;
        //console.log(e);
        res.json(postResponse);
      });

    } else if (req.body.mode == 'check') {

      // CHECK mode
      console.log('CHECK');

      var outFile = req.body.id + '.out';
      var inFile = req.body.id + '.in';
      var scriptFile = 'blast_' + req.body.id + ".sh";
      var checkOutFile = 'ls blast/' + outFile;
      console.log(checkOutFile);
      exec(checkOutFile, function(error, stdout, stderr) {
        logStoutSterrErr(checkOutFile, stdout, stderr, error);

        if (stdout.length > 0) {
          // output file exists
          var checkNumOflines = 'wc -l blast/' + outFile;
          exec(checkNumOflines, function(error, stdout, stderr) {
            logStoutSterrErr(checkNumOflines, stdout, stderr, error);
            console.log(stdout);
            var split = (stdout.trim()).split(" ");
            var numOflines = parseInt(split[0]);

            console.log("number of lines : " + numOflines);
            if (numOflines > 0) {

              // output file exists and not empty -> BLAST is finished
              console.log("parsing files");

              query = '';
              var array = fs.readFileSync('blast/' + outFile).toString().split("\n");
              var listOfUPIDs = [];
              for (var i = 0; i < Math.min(5, array.length); i++) {
                var line = array[i];
                var split = line.split('\t');
                var entries = split[1].split('|');
                if (i > 0) {
                  query += ' OR ';
                }
                query += ('uniprotid:' + entries[2]);
                listOfUPIDs.append(entries[2]);
              }

              // remove BLAST input file
              var removeBlastIn = 'rm -f blast/' + inFile;
              exec(removeBlastIn, function(error, stdout, stderr){
                logStoutSterrErr(removeBlastIn, stdout, stderr, error);
              });

              // remove BLAST output file
              var removeBlastIn = 'rm -f blast/' + outFile;
              exec(removeBlastOut, function(error, stdout, stderr){
                logStoutSterrErr(removeBlastOut, stdout, stderr, error);
              });

              // remove BLAST script file
              var removeBlastScript = 'rm -f blast/' + scriptFile;
              exec(removeBlastScript, function(error, stdout, stderr){
                logStoutSterrErr(removeBlastScript, stdout, stderr, error);
              });

              cursorMark = '*';
              query = encodeURIComponent(query);

              // add list of uniprot id to cache
              myCache.set(req.body.sequence, listOfUPIDs);

              var solrQueryComplete = 'http://localhost:8983/solr/pubseq/select?wt=json&indent=true&q=' +
                query +
                '&sort=pubdate+desc%2Cpmid+desc%2c&rows%2Cpmid+desc=10&cursorMark=' +
                cursorMark;
              postResponse['status'] = 'done';
              postResponse['query'] = query;

              http.get(solrQueryComplete, function(resp) {

                console.log('Got response from Solr index');
                var dataStr = '';

                resp.on("data", function(chunk) {

                  // 0 indicates success
                  postResponse['solrStatus'] = 0;
                  dataStr += chunk;

                });

                resp.on('end', function() {

                  console.log(dataStr);
                  var resObj = JSON.parse(dataStr);
                  postResponse['respBody'] = resObj;
                  res.json(postResponse);
                });

              }).on('error', function(e) {
                console.log('Got error from Solr index');
                // any status > 0 indicates failure
                postResponse['solrStatus'] = 1;
                //console.log(e);
                res.json(postResponse);
              });
            } else {
              // output file exists but empty -> BLAST is not finished yet
              postResponse['id'] = req.body.id;
              postResponse['status'] = 'running';
              res.json(postResponse);
            }
          });
        } else {
          // output file doesn't exist -> BLAST is not finished yet
          postResponse['id'] = req.body.id;
          postResponse['sequence'] = res.body.sequence;
          postResponse['status'] = 'running';
          res.json(postResponse);
        }
      });
    }
  }
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