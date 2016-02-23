
var fs      = require('fs-extra');
var request = require('request');
var express = require('express');
var extend  = require('extend');
var AdmZip  = require('adm-zip'); 
var path    = require('path');

// ------------------------------------------
//  CONSTRUCTOR
// ------------------------------------------

var TMP  = '';
var init = function(){
  info('Starting Marketplace ...');
  
  // Create temp plugin directory
  TMP = SARAH.ConfigManager.PLUGIN+'/tmp'; 
  if (!fs.existsSync(TMP)){ fs.mkdirSync(TMP); }
  
  // Refresh remote plugins
  refresh();
  
  return Marketplace;
}

// ------------------------------------------
//  MARKETPLACE
// ------------------------------------------

var MARKETPLACE = 'http://plugins.sarah.encausse.net';

var cache = {};
var refresh = function(){
  request({ 
    'uri' : MARKETPLACE, 
    'json' : true,
    'headers': {'user-agent': SARAH.USERAGENT} 
  }, 
  function (err, response, json){
    if (err || response.statusCode != 200) {
      return warn("Can't retrieve remote plugins");
    }
    cache = json;
  });
}


// ------------------------------------------
//  SEARCH
// ------------------------------------------

var filter = function(name, plugin, search){
  if (!search) return true;
  search = search.toLowerCase();
  
  for (var key in plugin){
    if (name.toLowerCase().indexOf(search) >= 0) return true;
    if(plugin[key] && plugin[key].toLowerCase().indexOf(search) >= 0) return true;
  }
  return false;
}

// ------------------------------------------
//  INSTALL
// ------------------------------------------


var install = function(name, callback){
  var market = cache[name]; 
  if (!market || !market.dl){ return callback(); }
  installURL(market.dl, SARAH.ConfigManager.PLUGIN+'/'+name, callback);
}

var installURL = function(url, path, callback){
  
  // Delete previous zip if exists
  var archive = TMP + '/' + 'tmp.zip';
  var drop    = TMP + '/' + 'archive';
  if ( fs.existsSync(archive)){ fs.unlinkSync(archive); }
  if ( fs.existsSync(drop))   { fs.removeSync(drop);    }
  if (!fs.existsSync(drop))   { fs.mkdirSync(drop);     }
  info('Downloading %s to store...', url, drop, path);
  
  // Download file
  request({ 
    'uri' : url, 
    'headers': {'user-agent': SARAH.USERAGENT} 
  }, 
  function (err, response, json){
    if (err || response.statusCode != 200) {
      warn("Can't download remote plugin", url, err);
      return callback();
    }
  }).pipe(fs.createWriteStream(archive)).on('close', function(){
    
    var zip = new AdmZip(archive);
    zip.extractAllTo(drop, true);
    
    // Recursive function 
    var copy = function(root){ 
      var files = fs.readdirSync(root);
      if (files.length != 1){ 
        fs.rename(root, path, function(){}); 
      } else {
        root += '/' + files[0];
        if (fs.statSync(root).isDirectory()){ copy(root); }
      }
    }
    
    copy(drop); // Perform copy
    fs.removeSync(drop); // Clean remaining stuff
    callback();
    
  });
}

// ------------------------------------------
//  GITHUB
// ------------------------------------------

var TEMPLATE = 'http://template.sarah.encausse.net';
var clone = function(body, callback){
  if (!body.name) { return callback('store.github.msg.name'); }
  if (!body.url)  { return callback('store.github.msg.url');  }
  
  var name = body.name.toLowerCase().replace(' ', '_');
  var path = SARAH.ConfigManager.PLUGIN+'/'+name;
  if (fs.existsSync(path)){ return callback('store.msg.exists'); }
  
  gitClone(body.url, path, callback);
}

var create = function(body, callback){
  if (!body.name) { return callback('store.new.msg.name'); }
  
  var name = body.name.toLowerCase().replace(' ', '_');
  var path = SARAH.ConfigManager.PLUGIN+'/'+body.name;
  if (fs.existsSync(path)){ return callback('store.msg.exists'); }
  
  gitClone(TEMPLATE, path, function(){
    rename(path, { 
      "template": name, 
      "template_description": body.description 
    });
    callback('store.msg.ok');
  });
}

/*
var Git = require("nodegit");
var gitClone = function(giturl, path, callback){
  info('Cloning repository %s at %s', giturl, path);
  Git.Clone(giturl, path).then(function(repository) {
    callback('store.msg.ok');
  });
}*/

var gitClone = function(giturl, path, callback){
  var url = giturl.replace('.git', '/archive/master.zip');
  installURL(url, path, callback);
}

var rename = function(file, matches){
  
  // Directory
  if (fs.statSync(file).isDirectory()){
    var files = fs.readdirSync(file);
    for(var i in files){
      rename(file+'/'+files[i], matches);
    }
    return;
  }
  
  // Replace filename
  var name = path.basename(file);
  if (name.indexOf('template') >= 0){
    var dest = path.dirname(file) + '/' + name.replace(/template/g, matches.template);
    fs.renameSync(file, dest);
    file = dest;
  }
  
  // Clean path
  file = path.normalize(file);
  
  var ext = path.extname(file);
  if (!(ext == '.html' || ext == '.ejs' || ext == '.js' || ext == '.xml' || ext == '.prop' || ext == '.less' || ext == '.md')){ return; }
  
  // Search and replace
  var data = fs.readFileSync(file, 'utf8');
      data = data.replace(/template_description/g, matches.template_description || '');
      data = data.replace(/template_version/g,     matches.template_version     || '');
      data = data.replace(/template/g,             matches.template);
      data = data.replace(/Template/g,             matches.template.capitalize());
  fs.writeFile(file, data, 'utf8');
}


// ------------------------------------------
//  TEST
// ------------------------------------------

var getMostRecentCommit = function(repository) {
  return repository.getBranchCommit("master");
};

var getCommitMessage = function(commit) {
  return commit.message();
};

var getCommits = function(name, callback){
  var path = SARAH.ConfigManager.PLUGIN+'/'+name;
  var err  = function(){ callback(); }
  
  Git.Repository.open(path)
    .then(getMostRecentCommit, err)
    .then(getCommitMessage,    err)
    .then(function(message) { callback(message); }, err);
}

// ------------------------------------------
//  ROUTER
// ------------------------------------------

var Router = express.Router();

Router.get('/portal/store', function(req, res, next) {
  res.locals.sidebar.nav[0].active = true;
  res.render('store/store.ejs', { marketplace : cache });
});

Router.post('/portal/store', function(req, res, next) {
  
  var callback = function(msg){
    var url = '/portal/store';
        url += msg ? '?msg='+msg : '';
    res.redirect(url);
  }
  
  var name = req.body.opInstall;
  if (name){ install(name, callback); }
  
  var name = req.body.opDelete;
  if (name){ SARAH.PluginManager.remove(name, callback); }
  
  var op = req.body.opCreate;
  if (op){ create(req.body, callback); }
  
  var op = req.body.opGitClone;
  if (op){ clone(req.body, callback); }
  
});

// ------------------------------------------
//  PUBLIC
// ------------------------------------------

var Marketplace = {
  'init'       : init,
  'filter'     : filter,
  'getCommits' : getCommits,
  'Router'     : Router
}

// Exports Manager
exports.init = Marketplace.init;

