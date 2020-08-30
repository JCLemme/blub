require('module-alias/register')

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var flash = require("connect-flash");
var passport = require('passport')
var session = require('express-session')

var BlubSetup = require('./blub_setup.js')
var BlubGlobals = require('./blub_globals.js')
const fs = require('fs');

var queueclient = require('@talkers/queue_talker.js');
var loginclient = require('@talkers/login_talker.js');
var adminclient = require('@talkers/admin_talker.js');

var machines = require('@workers/machine_worker.js');
var userz = require('@workers/user_worker.js');

var indexRouter = require('@routes/index');
var loginRouter = require('@routes/login');
var queueRouter = require('@routes/queue');
var usersRouter = require('@routes/users');
var adminRouter = require('@routes/admin');
var guacRouter = require('@routes/guacamole');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(flash());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

megasession = session({ secret: BlubSetup.cookie_secret });
app.use(megasession);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/queue', queueRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/guacamole', guacRouter);
app.use(express.static('guacamole-common-js'))
 
const MongoClient = require('mongodb').MongoClient;

// This is where mongo testing lives
(async() => {

    // Connect to database
    const client = await MongoClient.connect(BlubSetup.mongo_host, { useUnifiedTopology: true, useNewUrlParser: true }).catch(err => { console.log(err); });
    BlubGlobals.database = client.db('blub');
    
    console.log(await userz.queue_join('jlemme', ''));
    console.log(await userz.user_search('jlemme'));

})()
//while(true) {}
// End of mongotest


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals
  res.locals.message = err.message;
  res.locals.error = err;

  // render the error page
  res.status(err.status || 500);
  res.render('error', { client_server: "wss://" + BlubSetup.host + ':' + BlubSetup.client_port_external } );
});

module.exports = app;
