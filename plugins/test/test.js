
exports.init = function(){
  // Initialize resources of this plugin
  // All declared variables are scoped to this plugin 
  
  info('Plugin TEST is initializing ...');
}

exports.dispose = function(){
  // Dispose all resources no longer need 
  // a new instance of this plugin will be called
  // This function do not stand async code !
  
  info('Plugin TEST is disposed ...');
}

exports.ajax = function(req, res, next){
  // Called before rendering portlet when clicking on 
  // <a href="/plugin/template" data-action="ajax">click me</a>  
  // Because portlet CAN'T do asynchronous code
  info('Plugin TEST ajax request ...');
  next();
}

exports.speak = function(tts, async){
  // Hook called for each SARAH.speak()
  // to perform change on string
  // return false to prevent speaking
  
  info('Speaking : %s', tts, async);
  return tts;
}

exports.standBy = function(motion, device){
  // Hook called for each motion in a given device
  // to start/stop action when there is no moves

  info('Motion on %s: %s', device, motion);
}

exports.action = function(data, next){
  // Called by SARAH to perform main action
  
  info('Plugin TEST is actioned ...');
  console.log('Last profile:', Profile, Profile.last);
  
  // This is a synchronize speech (async have no callback)
  //SARAH.speak('Bonjour !', function(){
    // with next step here
  //  console.log('After the speech');  
  //});
  
  // The function next() MUST be called when job is done, 
  // with relevant data for next plugin and caller.
  next();
}
