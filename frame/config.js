var path = require('path')
	,fs = require('fs')
	,querystring = require('querystring')


//用nest下的config 覆盖frame下的config 如果有的话
var cPath
function wrapExpt(configPath){
	function requirePathAbs(ini_file){
		var p1 = configPath && path.resolve(configPath ,ini_file)
			,p2= path.resolve(__dirname , 'config' , ini_file)
		var ini_file_path = (p1 && fs.existsSync(p1)) ? p1 : p2
		return require(ini_file_path)
	} 	

	cPath = requirePathAbs('path.json')

	exports.path = cPath
	exports.session = requirePathAbs('session.json') 
		

	exports.site = requirePathAbs('site.json') 

	exports.etc = requirePathAbs('etc.json') 
	exports.api = requirePathAbs('api.json')

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
	exports.virtualHost = requirePathAbs('virtual_host.json') 

}

exports.setAbsPath = function (webRoot , options) {
	var configPath = options.configPath
		,appsPath = options.appsPath	
		,staticCompilerPath = options.staticCompilerPath
	wrapExpt(configPath)

	//exports.etc.onPort
	webRoot += path.sep
	
	for (var p in cPath){
		cPath[p] = cPath[p].replace(/\//g, path.sep)
		if (['appPath' ,'mock' ,'static' , 'views' , 'model' , 'controller'].indexOf(p) !== -1 ){
			continue
		}
		if (p != 'webRoot' && cPath[p][0] != path.sep) {
			cPath[p] = webRoot + cPath[p];
		}
	}
	if (cPath.compiledViews) cPath.compiledViews = path.resolve(webRoot,cPath.compiledViews) + path.sep

	if (configPath){
		cPath.config = path.resolve(configPath) +  path.sep 
	}
	if (appsPath){
		cPath.appPath = path.resolve(appsPath) +  path.sep
	}else {
		if (cPath.appPath) cPath.appPath = path.resolve(webRoot,cPath.appPath) + path.sep 
		else cPath.appPath = ''
	}
	cPath.staticBaseCompiler = path.resolve(cPath.lib ,'compiler' , 'index.js')
	cPath.staticCompiler = staticCompilerPath || path.resolve(cPath.lib ,'compiler')
	cPath.webRoot = webRoot
	//console.log(cPath)
}
