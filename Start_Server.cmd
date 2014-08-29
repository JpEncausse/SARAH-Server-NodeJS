SET PATH_NODEJS=%cd%\server\NodeJS
SET PATH_EXPRESS=%cd%\server\ExpressJS
SET PATH_PHANTOM=%cd%\server\PhantomJS
SET PATH_SARAH=%cd%\server\app
SET PATH_PLUGINS=%cd%\plugins

SET NODE_PATH=%PATH_NODEJS%\node_modules\;%PATH_EXPRESS%\node_modules\;%PATH_SARAH%\node_modules\;
"%PATH_NODEJS%\node.exe" %PATH_SARAH%/app.js
