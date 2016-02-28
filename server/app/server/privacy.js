var express = require('express');
var extend  = require('extend');
var request = require('request');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting PrivacyManager ...');
  salt();
  
  return PrivacyManager;
}

// ------------------------------------------
//  USERS
// ------------------------------------------

var findByUsername = function (username, fn) {
  setTimeout(function(){ // slow bruteforce
    
    var user = Config.auth['local-users'][username]
    if (user){ return fn(null, user); }
    return fn(null, null);
    
  }, 1000);
}

// ------------------------------------------
//  PASSPORT
// ------------------------------------------

var passport = require('passport');

passport.serializeUser  (function(user, done) { /*info('serializeUser',   user);*/ done(null, user); });
passport.deserializeUser(function(obj, done)  { /*info('deserializeUser', obj);*/  done(null, obj);  });

// ------------------------------------------
//  LOCAL STRATEGY
// ------------------------------------------

var setLocalStrategy = function(passport, router){
  router.get('/login', function(req, res, next) {
    res.render('portal/login.ejs', { 'redirect' : req.query.redirect });
  });
  
  router.post('/login', 
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: false }), function(req, res) { 
      if (req.body.redirect){
        res.redirect(req.body.redirect);
      } else {
        res.redirect('/');
      } 
    }
  );
  
  var LocalStrategy = require('passport-local').Strategy;
  passport.use(new LocalStrategy(local));
}

var local = function(username, password, done) {
  process.nextTick(function () {
    findByUsername(username, function(err, user) {
      
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
      
      var passHash = hash(password);
      if (user.password != passHash) { 
        info('Invalid password');
        return done(null, false, { message: 'Invalid password' }); 
      }
      
      return done(null, user);
    });
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
// setGoogleStrategy(passport, Router);

// Security
Router.all('*', function(req, res, next) {
  
  // Security Hole: ByPass for client
  if ( req.path.startsWith('/sarah') 
    || req.path.startsWith('/askme')
    || req.path.startsWith('/standby')){
    return next();
  }
  
  // Set user authentication 
  if (Config.auth && Config.auth['local-users']){
  if (!req.isAuthenticated()){ 
    
    var redirectURL = encodeURIComponent(req.url);
    return res.redirect('/login?redirect='+redirectURL); }  
  } else { req.user = { displayName : '' }}
  
  next();
});

Router.get('/profile', function(req, res){
  res.render('portal/profile.ejs', { "user" : req.user });
});

Router.post('/profile', function(req, res){
  
  var username    = req.body.username;
  var password    = req.body.password;
  var newPassword = req.body.newpassword;
  var displayName = req.body.displayname;
  
  // Retrieve user
  var user = Config.auth['local-users'][req.user.login];
  
  // Check Old password
  var oldHash = hash(password);
  if (user.password !== oldHash){
    res.redirect('/');
    return;
  }
  
  // Update new password
  var newHash = hash(newPassword);
  user.password = newHash;
  user.displayName = displayName;
  SARAH.ConfigManager.save();
  
  res.redirect('/');
});

Router.get('/profile/delete', function(req, res){
  delete Config.auth['local-users'][req.query.id]
  SARAH.ConfigManager.save();
});

Router.all('/profile/create', function(req, res){
  var msg = undefined;
  var op  = req.body.op;
  
  if (op){
    if (req.body.login && req.body.password && req.body.displayname){
      Config.auth['local-users'][req.body.login] = {
        login       : req.body.login,
        password    : hash(req.body.password),
        displayName : req.body.displayname,
      }
      SARAH.ConfigManager.save();
    } else { msg = i18n('portal.error.missing'); }
  }
  
  res.render('portal/modal-profile.ejs', { 'message': msg, 'op': op });
});

// ------------------------------------------
//  CRYPTO
// ------------------------------------------

var bcrypt = require('bcryptjs');

var ITERATION = 10000;
var hash   = function(password){
  var salt = Config.auth['local-salt'];
  //    salt = new Buffer(salt, 'hex');
  //var key  = Crypto.pbkdf2Sync(password, salt, ITERATION, 64);
  //var hash = 'pbkdf2$' + ITERATION + '$' + key.toString('hex') + '$' + salt.toString('hex');
  var hash = bcrypt.hashSync(password, salt);
  return hash;
}

var salt = function(){
  if (Config.auth['local-salt'] != false) return;
  
  // var salt = ('salt' + (Math.random()*10000)).replace('.','0');
  var salt = bcrypt.genSaltSync(10);
  var sarahId = 'uid-' + (new Date()).getTime();
  registerSARAH(sarahId);
  
  Config.auth['local-uid']  = sarahId
  Config.auth['local-salt'] = salt
  Config.auth['local-users']          = Config.auth['local-users']          || {};
  Config.auth['local-users']['admin'] = Config.auth['local-users']['admin'] || {};
  
  var admin = Config.auth['local-users']['admin'];
  admin.login       = 'admin';
  admin.password    = hash('password');
  admin.displayName = 'Admin';
  SARAH.ConfigManager.save();
}

var AMZID = '5eVBwYTHp21nzkXrcCC6e4UM93Pr2QMX5cLeD50S';
var registerSARAH = function(id){
 var url = 'http://tracker.sarah.encausse.net';
  request({ 
    'uri' : url+'?trackerId='+id, 
    'json' : true, 
    'headers': {'x-api-key': AMZID } 
  },
  function (err, response, json){
    if (err || response.statusCode != 200) { 
      return warn("Can't register SARAH into the Cloud", err, response);   
    }
  });
}


// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var PrivacyManager = {
  'init' : init,
  'Router' : Router
}

// Exports Manager
exports.init = PrivacyManager.init;