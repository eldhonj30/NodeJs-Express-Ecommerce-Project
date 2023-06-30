var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs = require('express-handlebars');
// var fileUpload = require('express-fileupload');
var db = require('./config/connection');
var session = require('express-session');
var nocache = require('nocache')
var handlebars = require('handlebars')


var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
const { log } = require('console');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layouts',layoutsDir:__dirname+'/views/layouts/',partialsDir:__dirname+'/views/partials/'}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
app.use(session({secret:"Key",cookie:{maxAge:600000*5}}))
app.use(nocache())


handlebars.registerHelper('eq', function (value1, value2) {
  return value1 === value2;
});

handlebars.registerHelper('gt', function (value1, value2) {
  return value1 > value2;
});

handlebars.registerHelper('lt', function (value1, value2) {
  return value1 < value2;
});
handlebars.registerHelper('add', function (value1, value2) {
  return value1 + value2;
});

handlebars.registerHelper('nteq', function (value1, value2) {
  return value1 !== value2;
});

db.connect((err)=>{
  if(err) console.log("Connection Error"+err);
  else console.log("Database Connected Succesfully");
});
app.use('/', userRouter);
app.use('/admin', adminRouter);

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
