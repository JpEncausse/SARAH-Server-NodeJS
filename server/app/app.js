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
var express = require('express');
var http = require('http');

var app = module.exports = express();
var server = http.createServer(app);

// Set EJS Engine
var engine = require('ejs-locals');
app.engine('ejs', engine);
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


app.use(multer({ dest:  __webapp+'/uploads' }))
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

// Set local helpers
app.locals.SARAH = SARAH;

// Serve static files
app.use(less(__webapp + '/static'));
app.use(serveStatic(__webapp + '/static'));


// ==========================================
//  ROUTERS
// ==========================================

SARAH.VIEWS = __webapp+'/views';

app.use(SARAH.ConfigManager.Router);
app.use(SARAH.LangManager.Router);
app.use(SARAH.PortalManager.Router);
app.use(SARAH.PluginManager.Router);
app.use(SARAH.ProfileManager.Router);
app.use(SARAH.Router);

// ==========================================
//  START SERVER
// ==========================================

var webapp = server.listen(SARAH.ConfigManager.Config.http.port);
info("Express server listening on port: %s", webapp.address().port);
