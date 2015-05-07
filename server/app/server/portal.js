var express = require('express');
var extend  = require('extend');
var request = require('request');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting PortalManager ...');
  
  // Load sidebar
  loadSidebar();
  
  // Refresh ticker
  refreshTicker();
  
  // Refresh ticker
  refreshRSSNews();
  
  return PortalManager;
}

// ------------------------------------------
//  SIDEBAR
// ------------------------------------------

var portal  = {}; 
var loadSidebar = function(){
  
  PortalManager.SIDEBAR = {
    'nav' : [
      { name : 'nav.store'       ,  url : '/portal/store' },
      { name : 'nav.rules'       ,  url : '/portal/rules' },
      { name : 'nav.experimental',  url : '/portal/experimental' },
      { name : 'nav.config'       , url : '/portal/config' },
      { name : 'nav.doc'         ,  url : '/portal/doc' },
      { name : 'nav.about'       ,  url : '/portal/about' }
    ],
    
    'links' : [
      { name : 'nav.encausse'    , url : 'http://sarah.encausse.net' },
      { name : 'nav.community'   , url : 'http://community.sarah.encausse.net' },
      { name : 'nav.marketplace' , url : 'http://marketplace.sarah.encausse.net' },
      { name : 'nav.map'         , url : 'http://map.sarah.encausse.net' }
    ]
  }
}

// ------------------------------------------
//  RENDER
// ------------------------------------------

var fs  = require('fs');
var ejs = require('ejs');
var render = function(path, options){
  var path = require('path').normalize(__dirname+'/../../' + path);
  if (!fs.existsSync(path)){ return "<h4>File not found: "+path+"</h4>"; }
  
  var text = fs.readFileSync(path, 'utf8');
  return ejs.render(text, options);
};

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var Router = express.Router();

// COMMON

Router.all('/', function(req, res, next) {
  res.redirect('/portal');
});

Router.all('*', function(req, res, next) {
  res.locals.req = req;
  res.locals.res = res;
  res.locals.require = require;    
  res.locals.message = false; 
  next();
});

Router.get('/confirm', function(req, res, next) { 
  return res.render('layout/confirm.ejs', {});
});

// PORTAL

Router.get('/portal*', function(req, res, next) {
  var menu = {}; extend(true, menu, PortalManager.SIDEBAR);
  res.locals.render  = render;
  res.locals.sidebar = menu;
  next();
});

Router.get('/portal', function(req, res, next) {
  res.render('portal/portal.ejs');
});

Router.get('/portal/rules', function(req, res, next) {
  res.locals.sidebar.nav[1].active = true;
  res.render('rules/rules.ejs');
});

Router.get('/portal/experimental', function(req, res, next) {
  res.locals.sidebar.nav[2].active = true;
  res.render('experimental/experimental.ejs');
});

Router.get('/portal/doc', function(req, res, next) {
  res.locals.sidebar.nav[3].active = true;
  res.render('portal/doc.ejs');
});

Router.get('/portal/about', function(req, res, next) {
  res.locals.sidebar.nav[4].active = true;
  res.render('portal/about.ejs');
});


// ------------------------------------------
//  TICKER
// ------------------------------------------

var ticker = '&nbsp;';
var refreshTicker = function(){
  var url = 'http://ticker.sarah.encausse.net';
  request({ 
    'uri' : url, 
    'json' : true, 
    'headers': {'user-agent': SARAH.USERAGENT } 
  }, 
  function (err, response, json){
    if (err || response.statusCode != 200) { 
      return warn("Can't retrieve remote ticker");   
    }
    ticker = json.message;
  });
  return ticker;
}

var refreshRSSNews = function(){
  var RSS = 'http://news.sarah.encausse.net';
  return SARAH.getRSSFeed(RSS);
}

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var PortalManager = {
  'init' : init,
  'refreshTicker' : refreshTicker,
  'refreshRSSNews': refreshRSSNews,
  'Router' : Router,
}

// Exports Manager
exports.init = PortalManager.init;