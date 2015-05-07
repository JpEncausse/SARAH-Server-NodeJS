var express = require('express');
var extend  = require('extend');
var request = require('request');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting PrivacyManager ...');

  
  return PrivacyManager;
}

// ------------------------------------------
//  USERS
// ------------------------------------------

var findByUsername = function (username, fn) {
  if (Config.auth.username == username){
    return fn(null, Config.auth);
  }
  return fn(null, null);
}

// ------------------------------------------
//  PASSPORT
// ------------------------------------------

var passport = require('passport');
var refresh  = require('passport-oauth2-refresh');

passport.serializeUser  (function(user, done) { /*info('serializeUser',   user);*/ done(null, user); });
passport.deserializeUser(function(obj, done)  { /*info('deserializeUser', obj);*/  done(null, obj);  });

// ------------------------------------------
//  LOCAL STRATEGY
// ------------------------------------------

var setLocalStrategy = function(passport, router){
  router.get('/login', function(req, res, next) {
    res.render('portal/login.ejs');
  });
  
  router.post('/login', 
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: false }),
    function(req, res) { res.redirect('/'); }
  );
  
  var LocalStrategy = require('passport-local').Strategy;
  passport.use(new LocalStrategy(local));
}

var local = function(username, password, done) {
  process.nextTick(function () {
    findByUsername(username, function(err, user) {
      
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
      if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
      
      return done(null, user);
    })
  });
}

// ------------------------------------------
//  GOOGLE STRATEGY
// ------------------------------------------

var setGoogleStrategy = function(passport, router){
  router.get('/auth', 
    passport.authenticate('google', { session: false })
  );
  
  router.get('/auth/callback',  
    passport.authenticate('google', { session: false, failureRedirect: '/portal/config' }), callback 
  );
  
  var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
  
  try {
  var strategy = new GoogleStrategy({
    clientID: Config.auth['google-key'],
    clientSecret: Config.auth['google-secret'],
    callbackURL: "http://localhost:8080/auth/callback",
    scope: Config.auth['google-services'].split('|') 
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      return done(null, profile);
    });
  })
  
  passport.use(strategy);
  refresh.use(strategy);
  } catch(ex){ warn('Wrong Google credential'); }
}

var callback = function(req, res) {
  ACCESS_TIMEOUT = (new Date()).getTime();
  ACCESS_TOKEN = req.user.accessToken;
  
  // Save refresh token for long use
  Config.auth['google-refresh'] = req.user.refreshToken;
  SARAH.ConfigManager.save();
  
  res.redirect('/portal/config');
}

var ACCESS_TIMEOUT = 0;
var ACCESS_TOKEN = false;
var getGoogleAccessToken = function(callback){
  var token = Config.auth['google-refresh'];
  if (!token) { return callback(false);  }
  var now = (new Date()).getTime();
  if (ACCESS_TOKEN && now - ACCESS_TIMEOUT < 1000*60*60) { return callback(ACCESS_TOKEN); } // 1 hour
  
  // Need a refresh
  info('Refresh Google Access Token');
  refresh.requestNewAccessToken('google', token, function(err, accessToken, refreshToken) {
    ACCESS_TIMEOUT = (new Date()).getTime();
    ACCESS_TOKEN = accessToken;
    callback(ACCESS_TOKEN);
  });
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var Router = express.Router();
Router.use(passport.initialize());
Router.use(passport.session());

Router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Set local strategy
setLocalStrategy(passport, Router);

// Set google strategy
setGoogleStrategy(passport, Router);

// Security
Router.all('*', function(req, res, next) {
  
  // Security Hole: ByPass for client
  if ( req.path.startsWith('/sarah') 
    || req.path.startsWith('/askme')
    || req.path.startsWith('/standby')){
    return next();
  }
  
  // Set user authentication 
  if (Config.auth && Config.auth.password){
  if (!req.isAuthenticated()){ 
    return res.redirect('/login'); }  
  } else { req.user = { displayName : '' }}
  
  next();
});

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var PrivacyManager = {
  'init' : init,
  'Router' : Router,
  'getGoogleAccessToken' : getGoogleAccessToken
}

// Exports Manager
exports.init = PrivacyManager.init;