var fs      = require('fs');
var extend  = require('extend');
var express = require('express');
var request = require('request');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting ConfigManager ...');
  
  // Load properties
  load();
  
  // Configure proxy
  if (Config.http.proxy){
    request.defaults({'proxy': Config.http.proxy})
  }
  
  // Expose properties to global
  global.Config = Config;
  
  return ConfigManager;
}

// ------------------------------------------
//  CONFIG
// ------------------------------------------
var path   = require('path');
var ROOT   = path.normalize(__dirname+'/..');

var SERVER = path.normalize(ROOT+'/server/server.prop');
var PLUGIN = process.env.PLUGINS_PATH || path.normalize(ROOT+'/../../plugins');
var VIEW   = path.normalize(ROOT+'/webapp/views');
var CUSTOM = path.normalize(ROOT+'/data/custom.prop');

info('ROOT', ROOT, '\nSERVER', SERVER, '\nPLUGIN', PLUGIN);

info('NODE_PATH', module.paths);

var Config = { 'debug' : false };
var load = function(){
  try { 
    extend(true, Config, loadProperties());
    extend(true, Config, loadPlugins());
    extend(true, Config, loadCustoms());
    Config.bot.version = "4.0";
  } 
  catch(ex) { error('Error while loading properties: %s', ex.message);  }
  return ConfigManager;
}

/**
 * Load default properties
 */
var loadProperties = function(){
  if (!fs.existsSync(SERVER)) { return {}; }
  info('Loading server properties...', SERVER);
  var json = fs.readFileSync(SERVER, 'utf8');
  return JSON.parse(json);
}

/**
 * Load plugin properties recursively
 */
var loadPlugins = function(folder, json){ 
  var json   = json   || {};
  var folder = folder || PLUGIN;

  if (!fs.existsSync(folder)) { return json; }  
  fs.readdirSync(folder).forEach(function(file){
    var path = folder+'/'+file;
    
    // Directory
    if (fs.statSync(path).isDirectory()){
      loadPlugins(path, json);
      return json;
    }
    
    // Ends with .prop
    if (file.endsWith('.prop')){
      info('Loading plugin properties... %s', path);
      try {
        var load   =  fs.readFileSync(path,'utf8');
        var plugin = JSON.parse(load);
        extend(true, json, plugin);
      } catch(ex){ error('Error in %s: %s', file, ex.message); }
    }
  });
  return json;
}

/**
 * Load custom properties
 */
var loadCustoms = function(){
  if (!fs.existsSync(CUSTOM)) { warn("Can't load custom properties !", CUSTOM); return {}; }
  info('Loading custom properties...', CUSTOM);
  
  var load = fs.readFileSync(CUSTOM,'utf8');
  var json = {}; 
  try { json = JSON.parse(load); } catch (ex){ error('Error in custom.prop: %s', ex.message); }
  
  json['modules']  = retains(json['modules'],  Config['modules']);
  json['phantoms'] = retains(json['phantoms'], Config['phantoms']);
  json['cron']     = retains(json['cron'],     Config['cron']);

  return json;
}

var retains = function(source, target){
  if (typeof source != 'object') return source;
  
  var clean  = {};
  Object.keys(source).forEach(function(attr){
    if (attr == 'description' || attr == 'version'){ return false; }
    if (target[attr] === undefined
        && attr != 'x' && attr != 'y' 
        && attr != 'w' && attr != 'h'
        && attr != 'c' && attr != 'disabled'){ return warn('Skip config: %s', attr); }
    clean[attr] = retains(source[attr], target[attr]);
  });
  
  return clean;
}

/**
 * Load plugin properties file
 */
var loadJSON = function(name){
  var path = PLUGIN+'/'+name+'/'+name+'.prop';
  if (!fs.existsSync(path)){ return {}; }
  info('Loading plugin properties... %s', path);
  try {
    var json = fs.readFileSync(path,'utf8');
    return JSON.parse(json);
  } catch(ex){ error('Error in %s: %s', name+'.prop', ex.message); }
}

// ------------------------------------------
//  SAVE
// ------------------------------------------

var setProperty = function(keys, value, json){
  var config = json || Config;
  var keys = keys.split('.');
  for (var k in keys){
    var key = keys[k];
    if (typeof config[key] === 'object' ){
      config = config[key];
    } else {
      config[key] = value;
    }
  }
}

var save = function(cfg) {
  try {
    Config = cfg || Config;
    var json = JSON.stringify(Config, undefined, 2);

    //json = json.replace(/\{/g,"{\n  ").replace(/\}/g,"\n  }").replace(/,/g,",\n  ");
    fs.writeFileSync(CUSTOM, json, 'utf8');
    info('Properties saved successfully');
  } catch(ex) {
    error('Error while saving properties: %s', ex.message);
  }
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------


var Router = express.Router();

Router.get('/portal/config', function(req, res, next) {
  res.render('portal/config.ejs');
});

Router.post('/portal/config', function(req, res, next) {
  var keys    = Object.keys(req.body);
  for(var i   = 0 ; i < keys.length ; i++){
    var key   = keys[i];
    var value = Helper.parse(req.body[key]);
    setProperty(key, value);
  }
  SARAH.ConfigManager.save();
  res.redirect('/portal/config');
});

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var ConfigManager = {
  'init'   : init,
  'load'   : load,
  'save'   : save,
  
  'loadJSON' : loadJSON,
  'getConfig': function(){ warn('getConfig is deprecated for SARAH 4.x, use global Config'); return Config; },
  'Router' : Router,
  'Config' : Config,
  'PLUGIN' : PLUGIN,
  'ROOT'   : ROOT,
  'VIEW'   : VIEW
}

// Exports Manager
exports.init = ConfigManager.init;