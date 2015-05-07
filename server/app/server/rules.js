var express = require('express');
var extend  = require('extend');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var init = function(){
  info('Starting RuleEngine ...');
  return RuleEngine;
}

// ------------------------------------------
//  SCRIPT
// ------------------------------------------

var dispatch = function(name, data, callback){
  // 1. Answer now to callback
  if (callback) { callback(data); }
  
  // 2. Then iterate on explicit rules
  iterate(name, data, 0);
}

var iterate = function(name, data, i){
  var options = data; // backward compatibility
  var rules = Config.rules;
  if (!rules){ return false; }
  
  for (; i < rules.length ; i++){
    try {
      var rule = rules[i];
      if (rule['disabled']){ continue; }
      if (rule['if'] != name){ continue; }
      if (rule['script']){ eval(decode(rule['script'])); }
      if (!rule['then']){ continue; }
      
      info('iterate ', i, rule);
      return SARAH.run(rule['then'], data, function(result){
        if (result) {
          // Handle speech
          SARAH.speak(result.tts);
          
          // Merge resutls
          extend(true, data, result);
        }
        
        // Recursive call
        iterate(name, data, i+1);
      });
      
    } catch(ex) { 
      warn('Rule %s:', name, rule, ex); 
      iterate(name, data, i+1);
    }
  }
}

var decode = function(str){
  if (!str){ return str; }
  return str.replace(/&quote;/g, '"').replace(/&#10;/g, '\n').trim();
}

// ------------------------------------------
//  SORTING MANAGER
// ------------------------------------------

var SEEK   = 1*60*3;  //  3 minutes
var SCOPE  = 1*60*10; // 10 minutes
var moment = require('moment'); moment.locale('fr');

var log = function(name, data){
  var now = moment();
  var day = moment().startOf('day');
  
  var entry        = {};
  entry.name       = name;
  entry.data       = data;
  entry.timeOfDay  = now.diff(day) / 1000;
  entry.dayOfWeek  = now.day();
  entry.dayOfMonth = now.date();
  entry.location   = 'house';
  entry.count      = 0;
  
  var i = indexOf(entry);
  if (i < 0){ 
    logs.push(entry); 
  } else {  
    entry = logs[i];
    entry.count++;
  }
  logs.sort(compare);
  
  return entry;
}

var indexOf = function(entry){
  for (var i = 0 ; i < logs.length; i++){
    if (compare(entry, logs[i]) == 0){ return i }
  }
  return -1;
}

var compare = function(x, y){
  var tod = x.timeOfDay  - y.timeOfDay;
  var dow = x.dayOfWeek  - y.dayOfWeek;
  var dom = x.dayOfMonth - y.dayOfMonth;
  var cnt = x.count - y.count;
  
  if (Math.abs(tod) < SCOPE ){
    if (x.name === y.name){ return 0; }
    var delta = (Math.abs(dom) + Math.abs(dow) + Math.abs(tod)) / ((Math.abs(cnt)+1) * SCOPE);
    if (dom != 0){ return dom>0 ? delta : -delta; }
    if (dow != 0){ return dow>0 ? delta : -delta; }
    if (cnt != 0){ return cnt>0 ? delta : -delta; }
    return tod>0 ? delta : -delta; //x.name.localeCompare(y.name); 
  }
  else { return tod; }
}

var next = function(entry){
  
  /*
  var i  = indexOf(entry);
  var d1 = 1000000;
  var e1 = undefined;
  
  var d2 = 1000000;
  var e2 = undefined;
  
  console.log(i,entry.name,'--------------------');
  for (var j in logs){
    console.log(j, logs[j].name);
  }
  
  if (i+1 < logs.length){
    e1 = logs[i+1];
    d1 = compare(e1, entry);
    console.log('i+1 <'+logs.length, e1.name, d1);
  }
  
  if (i-1 >= 0){
    e2 = logs[i-1];
    d2 = compare(entry, e2);
    console.log('i-1 >= 0', e2.name, d2);
  }
  
  return d1 < d2 ? e1 : e2;
  */
}

var logs = []
var getLogs = function(){
  return logs;
}


// ------------------------------------------
//  RULES
// ------------------------------------------

var getRules = function(ifname){
  
  // Set empty rules
  if (!Config.rules){
    Config.rules = [
      { "if": "before", "then": "", "script" : ""},
      { "if": "after",  "then": "", "script" : ""}
    ];
  }
  
  // Return all rules if there is no name
  if (!ifname){
    return Config.rules;
  }
  
  // Filter on name
  var tmp = [];
  for (var i in Config.rules){
    var rule = Config.rules[i];
    if (ifname == rule['if']){
      tmp.push(rule); 
    }
  }
  return tmp;
}

var save = function(body){
  if (!body['if']){ return; }
  
  var tmp = []
  for(var i in body['if']){
    var ifname = Helper.parse(body['if'][i]);
    if (!ifname) continue;
    
    tmp.push({
      "if" : ifname,
      "then" : Helper.parse(body['then'][i]),
      "script" : Helper.parse(body['script'][i]),
      "disabled" : Helper.parse(body['disabled'][i]),
    });
  }
  Config.rules = tmp;
  SARAH.ConfigManager.save();
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var Router = express.Router();
Router.post('/portal/rules', function(req, res, next) {
  var name = req.body.opSave;
  if (name){ save(req.body); }
  res.redirect('/portal/rules');
});

Router.all('/rules/script', function(req, res, next) {
  res.render('rules/rules-script.ejs', {'title' : i18n('modal.rules.script')});
});

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var RuleEngine = {
  'init' : init,
  'dispatch': dispatch,
  'log': log,
  'next': next,
  'getLogs': getLogs,
  'getRules': getRules,
  'before': function(){ return getRules('before')[0] },
  'after' : function(){ return getRules('after')[0]  },
  'Router' : Router
}

// Exports Manager
exports.init = RuleEngine.init;