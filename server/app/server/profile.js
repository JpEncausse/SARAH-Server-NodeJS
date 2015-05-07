var express = require('express');
var extend  = require('extend');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting ProfileManager ...');
  
  // Expose properties to global
  var Profile = {}
  global.Profile = Profile;
  
  return ProfileManager;
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------


var updateProfile = function(req, res, next) { 
  
  var name = req.params.name;
  var query   = {}; 
  var profile = {};

  var keys = Object.keys(req.query);
  for(var i=0 ; i < keys.length ; i++){
    var key = keys[i];
    var value = req.query[key];
    
    if (!key.startsWith('profile_')){
      query[key] = value;
      continue; 
    }
    
    profile[key.substring(8)] = parse(value);
  }

  if (profile.face){
    
    // Merge previous with new profile
    var previous = Profile[profile.face];
    if (previous){
      extend(true, previous, profile);
      profile = previous;
    }
    
    // Save profile for given face
    Profile[profile.face] = profile;
  }
   
  // Local profile
  req.query = query;
  req.query.profile = profile;
  Profile.last = profile;
  
  next();
}

var parse = function(str){
  if (str === 'true')  return true;
  if (str === 'false') return false;
  var num = parseInt(str);
  return isNaN(num) ? str : num;
}

var Router = express.Router();

Router.all('/sarah/:name', updateProfile);
Router.all('/standby',     updateProfile);
Router.all('/motion',      updateProfile);
Router.all('/askme',       updateProfile);


// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var ProfileManager = {
  'init'   : init,
  'Router' : Router
}

// Exports Manager
exports.init = ProfileManager.init;