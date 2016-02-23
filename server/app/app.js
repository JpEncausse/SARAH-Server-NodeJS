// ==========================================
//  HELPER Prototype
// ==========================================

String.prototype.endsWith = function(suffix) {
  if (!suffix) return false;
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.startsWith = function(prefix) {
  if (!prefix) return false;
  return this.indexOf(prefix) === 0;
};

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

global.Helper = {};

Helper.parse = function(str){
  if (str.trim) str = str.trim();
  if (str === 'true')  return true;
  if (str === 'false') return false;
  var num = Helper.isNumeric(str) ? parseFloat(str) : NaN;
  return isNaN(num) ? str : num;
}

Helper.isNumeric = function(value) {
  return /^\d+(\.\d+)?$/.test(value);
}

Helper.secToTime = function(duration) {
  var seconds = parseInt((duration)%60)
    , minutes = parseInt((duration/60)%60)
      , hours = parseInt((duration/(60*60))%24);

  hours   = (hours   < 10) ? "0" + hours   : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}

// ==========================================
//  LOG MANAGER
// ==========================================

var winston = require('winston');
winston.add(winston.transports.File, { filename: __dirname+'/data/server.log' });
winston.addColors({ info : 'blue', warn : 'orange', error : 'orange' });

// Add global function for logging
global.debug = winston.debug;
global.log   = winston.log;
global.info  = winston.info;
global.warn  = winston.warn;
global.error = winston.error;

// Catch all
process.on('uncaughtException', function (err) {
  error('Caught exception: '+err.stack);
});

// Starting SARAH
info("==========================================");
info(" STARTING SARAH Server ");
info(" Path: ", __dirname);
debug(" Modules: ", process.env.NODE_PATH);
info("==========================================");


// ==========================================
//  SARAH
// ==========================================

// Add SARAH to global functions
require('./server/sarah.js').init();



// ==========================================
//  EXPRESS SERVER
// ==========================================

// Init Express
var __webapp = __dirname + '/webapp';
var express  = require('express');
var http     = require('http');

var app      = module.exports = express();
var server   = http.createServer(app);

// SOCKET-IO
var io       = require('socket.io')(server);
SARAH.PluginManager.socket(io);

// Set EJS Engine
var engine = require('ejs-locals');
app.engine('ejs',  engine);
app.engine('html', engine);
app.set('views', __webapp + '/views');
app.set('view engine', 'ejs');

// Set Middleware
var multer = require('multer');
var less = require('less-middleware');
var methodOverride = require('method-override');
var serveStatic = require('serve-static');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

app.use(multer({ dest:  __webapp+'/uploads' }))
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ 
  secret: 'sarah',
  resave: true,
  saveUninitialized: true
}));

// Set local helpers
app.locals.SARAH = SARAH;

// Serve static files
app.use(less(__webapp + '/static'      , {}, {}, { 'compress' : false }));
app.use(less(SARAH.ConfigManager.PLUGIN, {}, {}, { 'compress' : false }));

app.use(serveStatic(__webapp + '/static'));

// ==========================================
//  ROUTERS
// ==========================================


var static_plugins = serveStatic(SARAH.ConfigManager.PLUGIN);
app.use(function(req, res, next){
  var path = req.path
  if (/^(\/plugin)*\/\w+\/www\/.*$/.test(path)){
    if (path.startsWith('/plugin')){
      res.redirect(path.substring('/plugin'.length));
      return res.end();
    }
    static_plugins(req, res, next);
  } 
  else { next(); }
});


app.use(SARAH.LangManager.Router);
app.use(SARAH.PrivacyManager.Router);
app.use(SARAH.PortalManager.Router);
app.use(SARAH.ConfigManager.Router);
app.use(SARAH.PluginManager.Router);
app.use(SARAH.ProfileManager.Router);
app.use(SARAH.RuleEngine.Router);
app.use(SARAH.Marketplace.Router);
app.use(SARAH.Router);


// ==========================================
//  START CRON
// ==========================================

SARAH.CRONManager.start();

// ==========================================
//  START SERVER
// ==========================================

var webapp = server.listen(SARAH.ConfigManager.Config.http.port);
info("Express server listening on port: %s", webapp.address().port);
