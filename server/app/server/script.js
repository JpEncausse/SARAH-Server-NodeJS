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

var run = function(name, options, callback){
  var data = {};
  extend(true, data, options);
  
  // 3. Finish by calling back
  var finish = function(json){
    if (json){ extend(true, data, json); }
    callback(data);
  }
  
  // 2. Dispatch to next script
  var dispatch = function(json){
    if (json){ extend(true, data, json); }
    //SARAH.RuleEngine.dispatch(name, data, finish);
    finish(json);
  }
  
  // 1. Call script
  call(name, data, dispatch);
}

var call = function(name, options, callback){
  
  // Find Plugin
  var plugin = SARAH.find(name);
  if (!plugin){
    warn('call('+name+') ', "Can't find plugin");
    if (callback){ callback(); } return;
  }
  
  // Set callback
  var finish = function(data){
    if (timeout){ clearTimeout(timeout); }
    
    var end = (new Date()).getTime();
    info('call('+name+') in ', (end-start)+'ms');
    
    if (callback){ callback(data); }
  }
  
  // Set timeout
  var timeout = setTimeout(function(){
    warn('call('+name+') as timeout ! Check plugin\'s callback()');
    finish(); 
  }, Config.http.timeout);

  // Run script
  var start = (new Date()).getTime();
  try { plugin.getInstance().action(options, finish); }
  catch(ex){ 
    error('call('+name+') ', ex.message);
    if (callback){ callback(); }
  }
}

// ------------------------------------------
//  HOOKS
// ------------------------------------------

var standBy = function(motion, device){
  var plugins = SARAH.PluginManager.getList();
  for (var i = 0 ; i < plugins.length ; i++){
    var plugin = plugins[i].getInstance();
    if (plugin.standBy) plugin.standBy(motion, device);
  }
}

var speak = function(tts, async){
  var plugins = SARAH.PluginManager.getList();
  for (var i = 0 ; i < plugins.length ; i++){
    var plugin = plugins[i].getInstance();
    if (plugin.speak){ 
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
  'standBy'  : standBy,
  'speak'    : speak
}

// Exports Manager
exports.init = ScriptManager.init;