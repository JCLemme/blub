var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var flash = require("connect-flash");
var passport = require('passport')
var session = require('express-session')
var mongodb = require('mongodb')
var machines = require('./machine_backend.js')

var adminclient = require('./admin_client.js');
var loginclient = require('./login_client.js');
var queueclient = require('./queue_client.js');
var queueworker = require('./queue_backend.js');

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var queueRouter = require('./routes/queue');
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.session({ cookie: { maxAge: 60000 }}));
//app.use(flash());

megasession = session({ secret: 'beep beep bitch' });
app.use(megasession);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/queue', queueRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

machines.load("files");

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
