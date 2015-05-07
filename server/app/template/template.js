
exports.action = function(data, next){
  
  // Called by SARAH to perform main action
  info('Plugin template is called ...', data);
  
  // Config is available everywhere
  // var version = Config.modules.template.version;
  
  // SARAH is available everywhere
  // SARAH.speak('Bonjour !');
  
  // The function next() MUST be called ONCE when job is done, 
  // with relevant data to call the next plugin by rule engine.
  next({ });
}

// ------------------------------------------
//  PLUGINS FUNCITONS
// ------------------------------------------

exports.init = function(){
  // Initialize resources of this plugin
  // All declared variables are scoped to this plugin 
  
  info('Plugin template is initializing ...');
}

exports.dispose = function(){
  // Dispose all resources no longer need 
  // a new instance of this plugin will be called
  // This function do not stand async code !
  
  info('Plugin template is disposed ...');
}

exports.ajax = function(req, res, next){
  // Called before rendering portlet when clicking on 
  // <a href="/plugin/template" data-action="ajax">click me</a>  
  // Because portlet CAN'T do asynchronous code
  next();
}

exports.speak = function(tts, async){
  // Hook called for each SARAH.speak()
  // to perform change on string
  // return false to prevent speaking
  // info('Speaking : %s', tts, async);
  return tts;
}

exports.standBy = function(motion, device){
  // Hook called for each motion in a given device
  // to start/stop action when there is no moves
  //info('Motion on %s: %s', device, motion);
}
