var fs      = require('fs-extra');
var request = require('request');
var express = require('express');
var extend  = require('extend');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting PluginManager ...');
  
  // Refresh local plugins
  refresh();
  
  return PluginManager;
}

// ------------------------------------------
//  HELPER: REQUIRE 
// ------------------------------------------

/**
 * Removes a module from the cache
 */
require.uncache = function (moduleName) {
  // Run over the cache looking for the files
  // loaded by the specified module name
  require.searchCache(moduleName, function (mod) {
    delete require.cache[mod.id];
  });
};

/**
 * Runs over the cache to search for all the cached files
 */
require.searchCache = function (moduleName, callback) {
  // Resolve the module identified by the specified name
  var mod = require.resolve(moduleName);

  // Check if the module has been resolved and found within
  // the cache
  if (mod && ((mod = require.cache[mod]) !== undefined)) {
    // Recursively go over the results
    (function run(mod) {
      // Go over each of the module's children and
      // run over it
      mod.children.forEach(function (child) {
          run(child);
      });

      // Call the specified callback providing the
      // found module
      callback(mod);
    })(mod);
  }
};

// ------------------------------------------
//  CLASS: PLUGIN
// ------------------------------------------

var TYPE_MODULES  = 'modules';
var TYPE_PHANTOMS = 'phantoms';
var TYPE_CRON     = 'cron';

function Plugin(options) {
  extend(false, this, options);
  
  // Link configuration
  this.config   = Config[TYPE_MODULES][this.name];
  this.phantoms = Config[TYPE_PHANTOMS][this.name];
  this.cron     = Config[TYPE_CRON][this.name];
  
  // Check has {plugin}.js
  var script = SARAH.ConfigManager.PLUGIN+'/'+this.name+'/'+this.name+'.js';
  if (fs.existsSync(script)){ 
    this.script = script;
  }
  
  // Check has custom portlet.ejs
  var template = SARAH.ConfigManager.PLUGIN+'/'+this.name+'/portlet.ejs';
  if (fs.existsSync(template)){
    this.template = template;
  } else {
    this.template = 'portlet.html';
  }
  
  // Check has index.ejs
  var index = SARAH.ConfigManager.PLUGIN+'/'+this.name+'/index.ejs';
  if (fs.existsSync(index)){
    this.index = index;
  }
}

Plugin.prototype.isDisabled = function(){
  if (!this.script) return true;
  return this.config.disabled;
}


Plugin.prototype.getLocale = function(locale){
  var path = SARAH.ConfigManager.PLUGIN+'/'+this.name+'/locales/'+locale+'.js';
  if (!fs.existsSync(path)){ info('No locals',path); return; }
  try { 
    var json = fs.readFileSync(path,'utf-8');
    info('Loading locales %s', path); 
    if (json) return JSON.parse(json); 
  } 
  catch(ex){ warn("Can't parse %s locales in %s", this.name, locale); }
  
  return false;
}

Plugin.prototype.getInstance = function(uncache){
  try {
    // Dispose
    if (Config.debug || uncache){ 
      if (this._script && this._script.dispose){ this._script.dispose(SARAH); }
      require.uncache(this.script); 
    }
    
    // Require
    this._script = require(this.script);
    
    // Initialise
    if (!this._script.initialized){
      this._script.initialized = true;
      if (this._script.init){ this._script.init(SARAH); }
    }
    
    // Last Modified
    var modified = fs.statSync(this.script).mtime.getTime();
    if (!this._script.lastModified){
      this._script.lastModified = modified;
    }
    
    // Reload if new version
    if (this._script.lastModified < modified){
      info('Reloading: ', this.name);
      return this.getInstance(true);
    }
    
    return this._script;
  } 
  catch (ex) { 
    warn('Error while loading plugin: %s', this.name, ex.message, ex.stack);
  }
}

// ------------------------------------------
//  CACHE PLUGINS
// ------------------------------------------

var cache    = {};
var getCache = function(){ return cache;  }

var refresh = function(){
  
  cache = {};
  
  // Find config
  var keys = Object.keys(Config[TYPE_MODULES]);
  
  // Build a list of plugins
  for(var i = 0 ; i < keys.length ; i++){
    var key = keys[i];
    cache[key] = new Plugin ({'name' : key });
    cache[key].getInstance();
  }
  
  keys = Object.keys(Config[TYPE_PHANTOMS]);
  for(var i = 0 ; i < keys.length ; i++){
    var key = keys[i];
    if (cache[key]) continue;
    cache[key] = new Plugin ({'name' : key });
    cache[key].getInstance();
  }
  
  keys = Object.keys(Config[TYPE_CRON]);
  for(var i = 0 ; i < keys.length ; i++){
    var key = keys[i];
    if (cache[key]) continue;
    cache[key] = new Plugin ({'name' : key });
    cache[key].getInstance();
  }
}

// ------------------------------------------
//  PLUGIN LOCALES
// ------------------------------------------

var getLocales = function(locale){ 
  var prop   = {}
  var keys   = Object.keys(cache);
  for(var i  = 0 ; i < keys.length ; i++){
    var key  = keys[i];
    var json = cache[key].getLocale(locale);
    if (json){ extend(true, prop, json); }
  }
  return prop;  
}

// ------------------------------------------
//  PLUGIN LIST
// ------------------------------------------

var sort = function(ids, xPos, yPos){
  for(var i = 0 ; i < ids.length ; i++){
    var tmp = cache[ids[i]];
    if (tmp){
      var cfg = tmp.config;
      cfg.x = parseInt(xPos[i])+1;
      cfg.y = parseInt(yPos[i])+1;
    }
  }
  getList(true);
}

var getList = function(clean){ 
  
  if (clean){ refresh(); }
  
  var keys = Object.keys(cache);
  keys = keys.sort(function(k1, k2){
    var conf1 = cache[k1].config;
    var conf2 = cache[k2].config;
    
    if (!conf1.y) return  1;
    if (!conf2.y) return -1;
    
    if (conf1.y < conf2.y) return  -1;
    if (conf1.y > conf2.y) return   1;
    return conf1.x < conf2.x ? -1 : 1;
  });
  
  var list = [];
  for(var i = 0 ; i < keys.length ; i++){
    var key = keys[i];
    var plugin = cache[key];
    
    // Skip disabled plugin
    if (plugin.isDisabled()){ continue; }
    
    list.push(plugin);
  }
  return list;
}


// ------------------------------------------
//  FIND / SEEK
// ------------------------------------------

var find = function(name){
  return cache[name];
}

var exists = function(name){
  var plugin = find(name);
  return plugin ? true : false;
}

var remove = function(name, callback){
  var plugin = find(name);
  if (!plugin){ return callback(); }
  
  // Remove from filesystem
  var path = SARAH.ConfigManager.PLUGIN+'/'+name;
  info('Removing %s plugin...', path);
  if (fs.existsSync(path)){ fs.removeSync(path); }
  
  // Remove in memory
  refresh();
  
  callback();
}

// ------------------------------------------
//  EVENT
// ------------------------------------------

var events = require('events');
var ee = new events.EventEmitter();

var listen = function(event, callback){
  ee.on(event, callback);
}

var trigger = function(event, data){
  ee.emit(event, data);
}

var socket = function(io){
  io.on('connection', function(socket){
    socket.on('disconnect', function(){ });
    
    for(var name in cache){
      plugin = cache[name].getInstance();
      if (plugin.socket) plugin.socket(io, socket);
    }
  });
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var Router = express.Router();

Router.get('/plugin/help/:name', function(req, res, next) { 
  var name   = req.params.name; 
  var plugin = find(name);
  
  if (plugin && plugin.index) {
    return res.render(plugin.index, {'title' : i18n('modal.plugin.help', name)});
  }
  next();
});

Router.get('/plugin/github/:name', function(req, res, next) { 
  var name   = req.params.name; 
  SARAH.Marketplace.getCommits(name, function(commits){
    res.render('plugin/github.ejs', {
      'title'   : i18n('modal.plugin.github', name),
      'commits' : commits
    });
  });
});

Router.get('/plugin/config/:name', function(req, res, next) { 
  var name   = req.params.name; 
  return res.render('plugin/config.ejs', {'title' : i18n('modal.plugin.config', name) });
});

Router.post('/plugin/config/:name', function(req, res, next) { 
  var name    = req.params.name; 
  var plugin  = find(name);
  var keys    = Object.keys(req.body);
  for(var i   = 0 ; i < keys.length ; i++){
    var key   = keys[i];
    var value = Helper.parse(req.body[key]);
    var pfx   = key.substring(0, key.indexOf('.'));  
    var prop  = key.substring(key.indexOf('.')+1);
    
    // skip internal parameter like ajax 
    if (!pfx) continue;
    
    info('[%s] %s.%s.%s = %s',key, pfx, name, prop, value);
    Config[pfx][name][prop] = value;
  }
  SARAH.ConfigManager.save();

  var referer = req.headers.referer;
  if (referer && referer.indexOf('/portal') < 0){
    return res.redirect(referer);
  } else {
    return res.render('plugin/config.ejs', {'title' : i18n('modal.plugin.config', name), 'message' : true });
  }
});

Router.get('/plugin/edit/:name', function(req, res, next) { 
  var name   = req.params.name; 
  var plugin = find(name);
  return res.render('plugin/edit.ejs', {'title' : i18n('modal.plugin.edit', name)});
});

Router.all('/plugin/sort', function(req, res, next) { 
  sort(req.query.ids, req.query.xPos, req.query.yPos);
  SARAH.ConfigManager.save();
  res.end();
});

Router.all('/plugin/:name/*', function(req, res, next) {
  var name   = req.params.name;
  var plugin = find(name);
  if (!plugin) return res.end();
  
  var path = req.params[0];
  if (!path) return res.end();
  
  try {
    var fullpath = SARAH.ConfigManager.PLUGIN+'/'+name+'/'+path;
    if (fs.existsSync(fullpath)){ 
      res.render(fullpath, { "plugin" : plugin, "title" : (req.query.title || req.body.title || "") });
    } else {
      warn('path not found:', fullpath);
    }
  } 
  catch (ex){ 
    warn('Error' , fullpath, ex.stack); 
  }
});

Router.all('/plugin/:name*', function(req, res, next) { 
  var plugin = find(req.params.name);
  if (!plugin) return res.end();
  
  var render = function(){
    res.render('portal/portlet.ejs', { "plugin" : plugin});
  }
  
  var instance = plugin.getInstance();
  if (instance.ajax){ instance.ajax(req, res, render); } else { render(); }
});

Router.all('/static/:name/*', function(req, res, next) { 
  var plugin = find(req.params.name);
  if (!plugin) return res.end();
  
  var instance = plugin.getInstance();
  if (instance.route) { 
    instance.route(req, res, next); 
  } else { next(); }
});


// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var PluginManager = {
  'init' : init,
  'getCache'      : getCache,
  'getList'       : getList,
  'getLocales'    : getLocales,
  
  'find'          : find,
  'exists'        : exists,
  'remove'        : remove,
  
  'socket'        : socket,            
  'trigger'       : trigger,
  'listen'        : listen,
  
  'Router'        : Router
}

// Exports Manager
exports.init = PluginManager.init;