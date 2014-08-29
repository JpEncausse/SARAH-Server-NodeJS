
exports.action = function(data, callback){
  var date = new Date();
  
  var text = 'il est ' + date.getHours() + ' heure ';
  if (date.getMinutes() > 0){ 
    text += date.getMinutes();
  }
  text += ' [name]';
  
  // Callback with TTS
  callback({'tts': text});
}
