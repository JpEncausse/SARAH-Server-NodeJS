
exports.action = function(data, next){
  
  var date = new Date();

  var text = 'il est ' + date.getHours() + ' heure ';
  if (date.getMinutes() > 0){ 
    text += date.getMinutes();
  }
  text += ' [name]';
  
  // Callback with TTS
  next({'tts': text});
}
