var fs      = require('fs');
var extend  = require('extend');
var express = require('express');
var l10n    = require('i18n');
var marked  = require('marked');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting LangManager ...', (__dirname + '/../locales'));
  
  l10n.extendRead = extendRead;
  
  l10n.configure({
    locales: ['en', 'fr'],
    cookie: COOKIE,
    updateFiles: false,
    directory: __dirname + '/../locales'
  });
  
  // Set global variable i18n
  global.i18n = function(key){
   var value = l10n.__.apply(this, arguments);
   var def   = arguments[arguments.length - 1];
   if (value == key) return def;
   return value;
  };
  
  // Set global variable markdown
  global.marked = markdown;
  
  return LangManager;
}

var markdown  = function(path){
  var lang = l10n.getLocale()
  
  var path = SARAH.ConfigManager.PLUGIN + '/' + path.replace('/','/locales/') + '.' + lang + '.md'; 
  if (!fs.existsSync(path)){ return; }
    
  var markdown = fs.readFileSync(path, 'utf8');
  return '<div class="markdown">' + marked(markdown) + '</div>';
}

var extendRead = function(locale){
  info('Loading all locales %s', locale);
  
  var prop = {};
  
  // Load core locales
  var path = __dirname + '/../locales/' + locale + '.js';
  if (fs.existsSync(path)){
    try {
      var json = fs.readFileSync(path, 'utf8');
      var core = JSON.parse(json);
      extend(true, prop, core);
    } 
    catch(ex){ warn("Can't parse core locale in %s", locale); }
  }
  
  // Load plugins locales
  var plugins = SARAH.PluginManager.getLocales(locale);
  extend(true, prop, plugins);
  
  return prop;
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var COOKIE = 'sarah-lang'
var Router = express.Router();

// Set lang according to cookie
Router.get('*', function(req, res, next) {
  var lang = req.cookies[COOKIE] || 'fr';
  l10n.setLocale(lang);
  res.locals.lang = lang;
  next();
})

// Set lang according to URL
Router.get('/lang/:lang', function(req, res, next) { 
  var lang = req.params.lang;
  info('Update language to %s', lang);
  l10n.setLocale(lang);
  res.cookie(COOKIE, lang, { maxAge: 900000 });
  res.redirect('/');
});

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var LangManager = {
  'init' : init,
  'Router' : Router
}

// Exports Manager
exports.init = LangManager.init;