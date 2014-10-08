var action = exports.action = function(data, callback){ 

  // Retrieve config
  var config = Config.modules.meteo;
  if (!config.zip){
    console.log("Missing Meteo config");
    callback({'tts' : 'Zip code invalide'});
    return;
  }
  
  // Request
  query(data.zip  || config.zip, 
        data.date || config.date, callback);
}

// ==========================================
//  QUERY
// ==========================================

var request = require('request');
var query = function(zip, date, callback){
  var url = 'http://www.meteo-france.mobi/ws/getDetail/france/'+zip+'.json';
  request({ 'uri' : url }, function (err, response, body){
    if (err || response.statusCode != 200) {
      return callback({'tts': "L'action a échoué"});
    }
    last = scrap(body, date);
    callback(last);
  });
}

// ==========================================
//  INIT
// ==========================================

var last = false;
exports.last = function(){ return last; };

// Refresh 'last' at startup
exports.init = function(){
  action({}, function(){});
}

// Refresh 'last' on click logo 
exports.ajax = function(req, res, next){
  action({}, next);
}

// ==========================================
//  SCRAP
// ==========================================

var scrap = function(body, date){

  var meteo  = JSON.parse(body).result;
  var json   = { tts : 'Météo: '};
  var prev   = getPrevision(meteo, date);

  json.place = meteo.ville.nom;
  json.temp  = prev.temperatureMin + '°C';
  json.sun   = prev.description;
  
  json.tts  += json.place + ": ";
  json.tts  += day[prev.jour+'_'+prev.moment]+', ';
  json.tts  += json.sun + ', '
  
  if (prev.temperatureMin != prev.temperatureMax){
    json.tts  += 'température entre ' + prev.temperatureMin + ' et ' + prev.temperatureMax + ' degrés';
  } else {
    json.tts  += 'température de ' + prev.temperatureMin + ' degrés';
  } 
 
  return json;
}

var getPrevision = function(meteo, date){
  var prevision = meteo.previsions;
  
  if (date.length > 2){
    return prevision[date]; 
  }
  
  date = parseInt(date);
  for (var p in prevision){ if (date-- <= 0) return prevision[p];  }
}

var day = {
  '0_matin': 'ce matin', 
  '0_midi' : 'ce midi', 
  '0_soir' : 'ce soir', 
  '0_nuit' : 'cette nuit',
  '1_matin': 'demain matin', 
  '1_midi' : 'demain midi', 
  '1_soir' : 'demain soir', 
  '1_nuit' : 'la nuit prochaine',
  '2_matin': 'après demain matin', 
  '2_midi' : 'après demain midi', 
  '2_soir' : 'après demain soir', 
  '2_nuit' : 'dans 2 nuits'
}
