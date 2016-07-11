var path = require('path')
	,fs = require('fs')
	,querystring = require('querystring')
var cPath = require ('./config/path.json')

exports.path = cPath;
exports.session = require ('./config/session.json'); 
    

exports.site = require ('./config/site.json'); 

exports.etc = require ('./config/etc.json') 
exports.api = require ('./config/api.json'); ;

var db = {
	mysql : null,
	mongo : null
}

if (fs.existsSync('./config/dbini.json')) {
	var dbini  = require ('./config/dbini.json')
	if (dbini.mysql) {
		var ini = dbini.mysql.trim().split("\n")	
		var mysql = {
			master : []
			,slave : []
		}
		ini.forEach(function(set){
			set = set.trim()
			if ('#' == set[0]) return
			set = querystring.parse(set, ' ')
			if (dbini.mysqlbase && dbini.mysqlbase != set.db) return

			set.password = set.pass
			set.database = set.db
			
			if (1 == set.master) mysql.master.push(set)
			else mysql.slave.push(set)

		})

		db.mysql = {
			master : getSet.bind(null , mysql.master) 
			,slave : getSet.bind(null , mysql.slave || mysql.master) 
		}
		function getSet(sets){
			if (1 == sets.length) return sets[0]
			return sets[Math.floor(Math.random() * sets.length)]
		}
	}
}

exports.db = db
exports.virtualHost = require('./config/virtual_host.json'); 


exports.setAbsPath = function (webRoot) {
	webRoot += path.sep;
	
	for (var p in cPath){
		cPath[p] = cPath[p].replace(/\//g, path.sep)
		if ('appPath' == p || 'views' == p || 'model' == p || 'controller' == p){
			continue
		}
		if (p != 'webRoot' && cPath[p][0] != path.sep) {
			cPath[p] = webRoot + cPath[p];
		}
	}
	if (cPath.compiledViews) cPath.compiledViews = path.resolve(webRoot,cPath.compiledViews) + path.sep
	if (cPath.appPath) cPath.appPath = path.resolve(webRoot,cPath.appPath) + path.sep 
	else cPath.appPath = ''
	cPath.webRoot = webRoot;
	//console.log(cPath)
}
