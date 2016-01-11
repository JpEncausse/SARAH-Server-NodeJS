var extend  = require('extend');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting ScriptManager ...');
  return ScriptManager;
}

// ------------------------------------------
//  RUN / CALL
// ------------------------------------------

var last = function(callback){
  if (_name && _last){
    run(_name, _last, callback);
  }
}
var _name, _last;
var run = function(name, options, callback, backup){
  
  // Last Backup
  if (backup){
    _name = name; _last = {};
    extend(true, _last, options);
    ScriptManager.lastContext = _last; // to be available everywhere
  }
  
  var data = {};
  extend(true, data, options);
  
  // 3. Finish by calling back
  var next = function(json){
    if (json){ extend(true, data, json); }
    if (callback) { callback(data); }
  }
  
  // 2. Dispatch to next script
  var dispatch = function(json){
    if (json){ extend(true, data, json); }
    
    // 1.3 Call script
    SARAH.RuleEngine.dispatch('after', data);
    
    // Dispatch
    SARAH.RuleEngine.dispatch(name, data, next);
  }
  
  // 1.1 Call before
  SARAH.RuleEngine.dispatch('before', data);
  
  // 1.2 Call script
  call(name, data, dispatch);
}

var call = function(name, options, callback){
  
  // Find Plugin
  var plugin = SARAH.find(name);
  if (!plugin){
    warn('call('+name+') ', "Can't find plugin");
    if (callback){ callback(); } return;
  }
  
  // Get instance outside of a zone;
  var plug = plugin.getInstance(); 
   
  // Set callback
  var next = function(data){
    if (timeout){ clearTimeout(timeout); } else { return; }
          
    var end = (new Date()).getTime();
    info('call('+name+') in ', (end-start)+'ms');
    
    if (data && data.error){
      error('call('+name+') ', data.error);
    }
    
    if (callback){ callback(data); }
  }
  
  // Set timeout
  var timeout = setTimeout(function(){
    warn('action('+name+') as timeout ! Check plugin\'s callback()');
    next();
  }, Config.http.timeout);
  
  // Run script
  var start  = (new Date()).getTime();
  try { 
    var instance = plugin.getInstance();
    plugin.getInstance().action(options, next, Config, SARAH);
  }
  catch(ex){ 
    error('call('+name+') ', ex.message);
    next();
  }
}

// ------------------------------------------
//  HOOKS
// ------------------------------------------

var standBy = function(motion, device){
  var plugins = SARAH.PluginManager.getList();
  for (var i = 0 ; i < plugins.length ; i++){
    var plugin = plugins[i].getInstance();
    if (plugin && plugin.standBy) plugin.standBy(motion, device);
  }
}

var speak = function(tts, async){
  if (!tts){ return tts; }
  
  // Answer
  if (tts == 'answer'){ 
    var answers = Config.bot.answers.split('|');
    tts = answers[ Math.floor(Math.random() * answers.length)];
  }
      
  // Dispatch to all plugins
  var plugins = SARAH.PluginManager.getList();
  for (var i = 0 ; i < plugins.length ; i++){
    var plugin = plugins[i].getInstance();
    if (plugin && plugin.speak){ 
      tts = plugin.speak(tts, async);
    }
  }
  
  // Replace Name
  if (Profile.last && Profile.last.face && Profile.last.face != "Unknow"){
    tts = tts.replace("[name]", Profile.last.face);
  }
  tts = tts.replace('[name]','');
  
  return tts;
}

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var ScriptManager = {
  'init'     : init,
  'run'      : run,
  'call'     : call,
  'last'     : last,
  'standBy'  : standBy,
  'speak'    : speak,
  'lastContext' : {}
}

// Exports Manager
exports.init = ScriptManager.init;