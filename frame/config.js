var path = require('path')
	,fs = require('fs')
	,querystring = require('querystring')
	,extend = require('util')._extend


//用nest下的config 覆盖frame下的config 如果有的话
var cPath
function wrapExpt(configPath ,extConfig){
	if (!configPath) configPath = path.resolve(__dirname , 'config')
	extConfig = extConfig || {}
	function requirePathAbs(ini_file){
		var p1 = configPath && path.resolve(configPath ,ini_file)
			,p2= path.resolve(__dirname , 'config' , ini_file)
		var ini_file_path = (p1 && fs.existsSync(p1)) ? p1 : (fs.existsSync(p2) ? p2 : null)
		if (!ini_file_path) return false 
		return require(ini_file_path)
	} 	

	cPath = requirePathAbs('path.json')

	exports.path = cPath
	exports.session = requirePathAbs('session.json') 
		

	exports.site = requirePathAbs('site.json') 

	exports.etc = requirePathAbs('etc.json') 
	exports.api = requirePathAbs('api.json')


	exports.db = requirePathAbs('database.json') 
	exports.virtualHost = requirePathAbs('virtual_host.json') 

	function extendFromOpt(){
		/*
		var _clone_ext = extend({} , extConfig)
		;['appsPath','configPath' ,'staticCompilerPath'].forEach(function(key){
			delete _clone_ext[key]
		})
		*/
		var _clone_ext = extConfig
		;['session' , 'site','etc' , 'api' ,'db' , 'virtualHost'].forEach(function(key){
			if (!extConfig[key]) return
			extend(exports[key] , _clone_ext[key])
		})

		//判断环境变量 生产环境将etc.watchingTpl设为false ，框架内使用watchingTpl判断是否缓存
		if (process.env.NODE_ENV == 'production') {
			exports.etc.watchingTpl = false
		}	
	}
	extendFromOpt()
}

exports.setAbsPath = function (webRoot , options) {
	var configPath = options.configPath
		,appsPath = options.appsPath	
		,staticCompilerPath = options.staticCompilerPath
	wrapExpt(configPath , options)

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
