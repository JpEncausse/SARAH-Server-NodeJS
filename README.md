# [S.A.R.A.H.](http://sarah.encausse.net)

[S.A.R.A.H.](http://sarah.encausse.net) is an OpenSource client/server framework to control Internet of Things using Voice, Gesture, Face, QRCode recognition. It is heavily bound to Kinect v1 and v2 SDK.


This project contains NodeJS **Server for SARAH**. And will communicate with [C# Client for SARAH](...).


## License

```
            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2012 S.A.R.A.H. <sarah.project@encausse.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.
```

```
 This program is free software. It comes without any warranty, to
 the extent permitted by applicable law. You can redistribute it
 and/or modify it under the terms of the Do What The Fuck You Want
 To Public License, Version 2, as published by S.A.R.A.H. See
 http://www.wtfpl.net/ for more details.
```

**Be Warned: some dependencies may require fees for commercial uses. Kinect XBox 360 can ONLY be used for development purpose**

## Description

SARAH v4.0 Server is built on an **Plugins Architecture** sharing common properties. It also relies on NodeJS, ExpressJS, PhantomJS.

This page describe Server's Core/Module specification. SARAH developers should see :
- [SARAH Wiki](http://wiki.sarah.encausse.net)
- [SARAH RFE and Issues](http://issues.sarah.encausse.net)

## Core

### NodeJS

- Winston         (https://github.com/flatiron/winston)
- Request         (https://github.com/mikeal/request)
- Extend          (https://github.com/justmoon/node-extend)
- i18n            (https://github.com/mashpie/i18n-node)
- moment          (https://github.com/moment/moment)
- feedparser      (https://github.com/danmactough/node-feedparser)
- ent             (https://github.com/substack/node-ent)
- nedb            (https://github.com/louischatriot/nedb)
- scraperjs ???   (https://github.com/ruipgil/scraperjs)
- zone ???        (https://github.com/nodeloop/zone) => broken
- passport        (https://github.com/jaredhanson/passport)
- unzip           (https://github.com/EvanOxfeld/node-unzip)
- fs-extra        (https://github.com/jprichardson/node-fs-extra)
- cron            (https://github.com/ncb000gt/node-cron)


### ExpressJS

- ejs             (https://github.com/visionmedia/ejs)
- ejs-locals      (https://github.com/RandomEtc/ejs-locals)
- cookie-parser   (https://github.com/expressjs/cookie-parser)
- serve-static    (https://github.com/expressjs/serve-static)
- less-middleware (https://github.com/emberfeather/less.js-middleware)
- multer          (https://github.com/expressjs/multer)


## SARAH Manager

SARAH is a **global** proxy for other manager. It also handle communication with Client. 

- `run(name, options, callback)`: Run standard plugin script
- `call(name, options, callback)`: Like run() but DO NOT trigger RuleEngine
- `last()`: Run last run command again with options
- `find(name)`: Retrieve the plugin object according to it's name
- `exists(name)`: Check if the plugin is available
- `speak(tts, callbackSync)`: Ask client text to speech
- `answer(callbackSync)`: Like (speak) with predefined answers
- `shutup(once)`: Ask client to stop ALL (or once) speaking
- `play(path, callbackSync)`: Play given path
- `stop(path)`: Stop given path
- `run(path, options)`: launch process with given path and parameters
- `activate(name)`: set to foreground given application name
- `keyText(text)`: send key stroke with modifier
- `keyUp(char, mod)`: send key stroke with modifier
- `keyDown(char, mod)`: send key stroke with modifier
- `keyPress(char, mod)`: send key stroke with modifier
- `face(pause)`: start/stop face recognition
- `gesture(pause)`: start/stop gesture recognition
- `listen(pause)`: start/stop listening
- `picture(device, path)`: take a picture and store 
- `recognize(path)`: perform speech recognition on given file / upload
- `context([names])`: set the context grammar
- `grammar(xml)`: Send a XML (inside a rule) to override a grammar
- `askme(tts, grammar, timeout, callback)`: Speak TTS, Set a dynamic grammar (key/value), ask twice if there is timeout, then call callback(answer, next) 
- `listen(event, callback)`: Listen to a given event
- `trigger(event, data)`: Send a given event
- `asknext(rule, options)`: Call given rule's example with options

### AskNext

The  SARAH.AskNext() build a dynamic grammar and wait for an answer. Use '*' for wildcards. 

```javascript
SARAH.askme("What is your favorite sound", {

  "I feel good"     : 'feelgood',
  "Highway to hell" : 'ACDC',
  "*"               : '*'

}, 10000, function(answer, end){
  SARAH.call('xbmc', { 'song' : answer }, function(options){ end(); });
});
```

## LangManager

The i18n() function is a **global** translate feature that relies on /locales JSON translation.  

- Plugins can have a `/locale/fr.js` for their translations
- Use `answer()` to move answers to an XML grammar


## Portal Manager

Portal Manager handle all Web GUI features. It also handle the Dashboard. 

### Libraries

- jquery 3.11.1    (http://jquery.com/)
- bootstrap 3.2.0  (https://github.com/twbs/bootstrap)
- bootstrap-switch (http://www.bootstrap-switch.org/)
- packery 1.2.3    (https://github.com/metafizzy/packery)
- moment 2.8.1     (https://github.com/moment/moment)
- famfamfam flags  (http://www.famfamfam.com/lab/icons/flags/)
- sparkline        (https://github.com/gwatts/jquery.sparkline)
- codemirror 4.6   (http://codemirror.net/)

### Layouts

The site render pages templates using EJS engine. New pages should relies on layout.ejs template. 


### Modal


#### Confirm

A little help that popup to confirm an action if the DOM element contains `.confirm` class

```
<button type="submit" class="btn btn-default confirm">Click Me</button>
```

### Ajax

TBW.

## Config Manager

Config Manager handle configuration of core and plugins.

- `server/server.prop` are root properties
- `{plugins}/{plugin}/{plugin}.prop` are plugin's root properties
- `data/custom.prop` are user properties

Config is a **global** JSON object merging all property files. DO NOT put password in server.prop or {plugin}.prop ONLY custom.prop.

### Update and Save

Configuration object should NEVER be cloned but only updated and saved using following code:

```
Config.bot.name = 'J.A.R.V.I.S';
SARAH.ConfigManager.save();
```

A POST to `/plugin/config/:name?modules.param=value` can peform a plugin update.


## Plugin Manager

Plugin Manager handle plugin life cycle, marketplace and installation.  Plugins folder is defined by Shell ENV var: PATH_PLUGINS

### Install

Use the Store to download or install plugins from marketplace. Otherwise create plugin from a template.

- `{plugin}.xml`  : The client XML grammar
- `{plugin}_en_US.xml` : The client XML grammar in english
- `{plugin}.js`   : The server script
- `{plugin}.prop` : The script properties 

#### Plugin's Server libraries

- `node_modules/` : All the nodejs custom libraries (use NPM) 

#### Plugin's WWW

- `portlet.ejs`  : Custom portlet template
- `index.ejs`    : Custom documentation opened in a modal
- `{plugin}.ejs`  : Custom dynamic webpage
- `www/`          : Contains all web resources served as static files

#### Plugin's locale

- `locales/`      : All the translations
- `locales/en.js` : English translations for i18n()
- `locales/fr.js` : French translation for i18n()


### Life cycle

TBW.



### Migration SARAH 3.x to 4.x

All plugin's static web resources MUST be in `/{plugin}/www/*`.

#### {plugin}.js

SARAH and Config are now global variables.

Rename `exports.action(data, callback, config, SARAH)` to `exports.action(data, next)`. 
(In JavaScript function parameter can be named as you want)

#### portlet.ejs

The `portlet.ejs` will replace `portlet.html`. Name is different for backward compatibility.
The `portlet_back.html` is no more...

#### index.ejs

The `index.ejs` will replace `index.html`. Name is different for backward compatibility.
It's now a modal ! Bootstrap grid is no longer required. Use &lt;h3&gt; and &lt;h4&gt; for title. 

#### {plugin}.css

Portal DOM has changed. There is no more gridster. SARAH v4.x provides LESS compilator.
The `/www/less/{plugin}.less` will replace the `{plugin}.css`. 

#### {plugin}.xml

- Remove &lt;example&gt; tags that are now a new way to speak using `SARAH.asknext()`.
- Remove weight no longer relevant
- There is to DTD: `semantics/1.0` and `semantics-ms/1.0` the first one use `out.*` the second use `$.` It seems to be the same code but `semantics-ms` may have access to windows built-in grammars... 

## Profile Manager

Manage profiling of current users

- Clean and attach Profile JSON object to request
- Store latest used profile  