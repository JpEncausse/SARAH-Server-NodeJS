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
//  LOGIN
// ------------------------------------------

var findById = function findById(id, fn) {
  var idx = id - 1;
  if (Config.auth.users[idx]) {
    fn(null, Config.auth.users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

var findByUsername = function (username, fn) {
  for (var i = 0, len = Config.auth.users.length; i < len; i++) {
    var user = Config.auth.users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var Router = express.Router();

// LOGIN
// http://scotch.io/tutorials/javascript/upgrading-our-easy-node-authentication-series-to-expressjs-4-0

var passport = require('passport');
Router.use(passport.initialize());
Router.use(passport.session());

passport.serializeUser  (function(user, done) { done(null, user); });
passport.deserializeUser(function(obj, done)  { done(null, obj);  });

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  function(username, password, done) {
    process.nextTick(function () {
      
      findByUsername(username, function(err, user) {
        
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
        
        return done(null, user);
      })
    });
  }
));

Router.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: false }),
  function(req, res) { res.redirect('/'); });
  
/*
var setProfile = function(identifier, profile, done) {
  process.nextTick(function () { // Async
    info('setProfile', identifier, profile);
    profile.identifier = identifier;
    
    var email = profile.emails[0].value;
    for(var i in Config.auth.users){
      if (email === Config.auth.users[i]){
        return done(null, profile);
      }
    }
    return done('This email is not authorized', null);
  });
}

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(new GoogleStrategy({
    clientID: Config.auth.clientID,
    clientSecret: Config.auth.clientSecret,
    callbackURL: Config.auth.local + "/auth/google/callback"
  },
  setProfile
));

Router.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email'] }),
  function(req, res, next){});

Router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res, next) { res.redirect('/'); });
*/

Router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

Router.get('/login', function(req, res, next) {
  res.render('portal/login.ejs');
});


// COMMON

Router.all('/', function(req, res, next) {
  res.redirect('/portal');
});

Router.all('*', function(req, res, next) {
  
  if (Config.auth && Config.auth.users){
    
    if (!req.isAuthenticated()){ return res.redirect('/login'); }  
  } else {
    req.user = { displayName : '' }
  }
  
  res.locals.req = req;
  res.locals.res = res;  
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