  var request    = require('request');
  var express    = require('express');
  var FeedParser = require('feedparser');
  var extend     = require('extend');
  var ent        = require('ent');
  
  var USERAGENT  = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.75 Safari/537.1";
  
// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting SARAH ...');
  global.SARAH = SARAH;
  
  SARAH.ConfigManager  = require('./config.js').init();
  SARAH.PluginManager  = require('./plugin.js').init();
  SARAH.LangManager    = require('./lang.js'  ).init();
  SARAH.PortalManager  = require('./portal.js').init();
  SARAH.ScriptManager  = require('./script.js').init();
  SARAH.ProfileManager = require('./profile.js').init();
  
  /*
  SARAH.RuleManager    = require('./rules.js').init();
  SARAH.PhantomManager = require('./phantom.js').init();
  SARAH.CRONManager    = require('./cron.js').init();
  */
  
  SARAH.run      = SARAH.ScriptManager.run;
  SARAH.call     = SARAH.ScriptManager.call;
  SARAH.last     = SARAH.ScriptManager.last;
  SARAH.find     = SARAH.PluginManager.find;
  SARAH.exists   = SARAH.PluginManager.exists;
  SARAH.trigger  = SARAH.PluginManager.trigger;
  SARAH.listen   = SARAH.PluginManager.listen;
  
  return SARAH;
}

// ------------------------------------------
//  RSS
// ------------------------------------------

var RSSFeedCache = {};
var getRSSFeed = function(url, cache){
  
  // Use cache
  if (!cache && RSSFeedCache[url]){ return RSSFeedCache[url]; }
  
  var feed = { items : [] };
  request(url)
  .pipe(new FeedParser())
  .on('meta', function (meta) { feed.meta = meta; })
  .on('readable', function() {
    var stream = this, item;
    while (item = stream.read()) { 
      item.description = ent.decode(item.description);
      feed.items.push(item);
    }
    RSSFeedCache[url] = feed; // Cache
  });
}

// ------------------------------------------
//  ASKME
// ------------------------------------------

var options = false;
var stack = [];

var end = function(){ 
  options = false;  next(); 
}

var next = function(){
  if (stack.length <= 0){ 
    return SARAH.context('default');
  }
  var args = stack.shift();
  askme(args[0], args[1], args[2], args[3])
}

var askme = function(tts, grammar, timeout, callback){
  if (!grammar) { return; }
  if (!callback){ return; }
  if (options)  { return stack.push(arguments); }
  
  // Build request
  info('AskMe', options);
  options = { 'sentences':[], 'tags':[] }
  if (tts) options.tts = tts;
  for (var g in grammar){
    options.sentences.push(g);
    options.tags.push(grammar[g]);
  }
  
  // Send request
  remote(options);
  
  // Backup
  options.rule     = grammar
  options.callback = callback;
  options.token    = setTimeout(function(){
      options = false;
      if (timeout <= 0){
        callback(false, end);
      } else {
        SARAH.askme(tts, grammar, 0, callback);
      }
  }, timeout || 16000);
}

var answerme = function(req, res, next){
  if (!options){ return; }
  if (options.token){ clearTimeout(options.token); }
  res.end();
  options.callback(req.param('dictation') || req.param('tag'), end);
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var Router = express.Router();

Router.all('/sarah/:name', function(req, res, next) { 
  
  var name = req.params.name;
  var options = {};
  extend(true, options, req.query);
  
  // FIXME: Here we should call the Rule Engine
  
  // 2. Send back TTS
  var callback = function(data){
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    
    // Speak
    if (data && data.tts){
      var tts = SARAH.ScriptManager.speak(data.tts);
      if (tts){ res.write(tts); }
    }
    
    res.end(); 
    
    // Ask next from data
    if (data && data.asknext){
      if (typeof data.asknext === 'string'){
        SARAH.asknext(data.asknext);
      } else {
        SARAH.asknext(data.asknext.rule, data.asknext);
      }
    }
    else if (options.asknext){
      SARAH.asknext(options.asknext);
    }
  }
  
  // 1. Run plugin's script
  SARAH.run(name, options, callback);
});

Router.all('/standby', function(req, res, next) { 
  var motion = req.query.motion == "True" ? true : false;
  SARAH.ScriptManager.standBy(motion, req.query.client);
  res.end(); 
});

Router.all('/askme', answerme);


// ------------------------------------------
//  REMOTE
// ------------------------------------------

var _callback = function (err, response, body){
  if (err || response.statusCode != 200) {
    warn("HTTP Error: ", err, response, body);
    return;
  }
};

var remote = function(query, callback){
  var url = Config.http.remote;
  var querystring = require('querystring');
  url += '?' + querystring.stringify(query);

  info('Remote: ', url);
  var request = require('request');
  request({ 'url' : url }, callback || _callback);
};

var speak = function(tts, callback){
  
  tts = SARAH.ScriptManager.speak(tts, callback);
  if (!tts){ return; }
  
  // Hook for TTS
  var qs = { 
    'tts'  : tts,
    'sync' : callback ? true : false
  };
  return remote(qs, callback);
}

var answer = function(tts, callback){
  var answers = Config.bot.answers.split('|');
  var answer = answers[ Math.floor(Math.random() * answers.length)];
  return speak(answer, callback);
}

var shutup = function(once){
  var qs = { 'notts' : 'true' }
  if (once){ qs.once = true; }
  return remote(qs);
}

var play = function(path, callback){
  // Hook for TTS
  var qs = { 
    'play'  : path,
    'sync' : callback ? true : false
  };
  return remote(qs, callback);
}

var stop = function(path){
  return remote({ 'stop' : path });
}

var runApp = function(path, params){
  var qs = { 'run' : path };
  if (params){ qs.runp = params; }
  return remote(qs);
}

var activate = function(process){
  return remote({ 'activate' : process });
}

var keyText = function(text){
  return remote({ 'keyText' : text });
}

var keyUp = function(key, mod){
  var qs = { 'keyUp' : key };
  if (mod){ qs.keyMod = mod; }
  return remote(qs);
}

var keyDown = function(key, mod){
  var qs = { 'keyDown' : key };
  if (mod){ qs.keyMod = mod; }
  return remote(qs);
}

var keyPress = function(key, mod){
  var qs = { 'keyPress' : key };
  if (mod){ qs.keyMod = mod; }
  return remote(qs);
}

var face = function(pause){
  return remote({ 'face' : pause });
}

var gesture = function(pause){
  return remote({ 'gesture' : pause });
}

var listen = function(pause){
  return remote({ 'listen' : pause });
}

var picture = function(device, path){
  var qs = { 'picture' : 'true' };
  if (path){ qs.picture = path; }
  if (device){ qs.device = device; }
  return remote(qs);
}

var recognize = function(path){
  return remote({ 'recognize' : path });
}

var context = function(rules){
  return remote({ 'context' : rules });
}

var grammar = function(xml){
  return remote({ 'grammar' : xml });
}

var asknext = function(rule, options){
  var qs = {'asknext' : rule };
  if (options){  extend(true, qs, options); }
  return remote(qs);
}

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var SARAH = {
  'init'      : init,
  'remote'    : remote,
              
  'speak'     : speak,
  'answer'    : answer,
  'shutup'    : shutup,
  'play'      : play,
  'stop'      : stop,
              
  'runApp'    : runApp,
  'activate'  : activate,
  'keyText'   : keyText,
  'keyUp'     : keyUp,
  'keyDown'   : keyDown,
  'keyPress'  : keyPress,
              
  'face'      : face,
  'gesture'   : gesture,
  'listen'    : listen,
  'picture'   : picture,
  'recognize' : recognize,
  
  'context'   : context,
  'grammar'   : grammar,
  'askme'     : askme,
  'asknext'   : asknext,
  
  'getRSSFeed' : getRSSFeed,
  'Router' : Router
}

// Exports SARAH singleton
exports.init = init;