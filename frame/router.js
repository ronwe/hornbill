
var fs = require("fs"),
    url = require('url'),
    path = require('path'),
    querystring = require('querystring')

	
var config = require('./config.js') 
var lookuped = {}
	,EchoStream
const SEP = path.sep

var middleware_before = []
	,middleware_after = []

function registConnect(connect , opt){
	opt = opt || {}
	var stack = opt.after ? middleware_after : middleware_before
	stack.push({
		conntion : connect,
		urlRegTest: opt.urlRegTest,
		host : opt.host
	})

}

function setGlobal(options){
	config.setAbsPath( __dirname , options)

	global.config = config
	global.base = require(config.path.base + 'base.js')
	global.controller = require(config.path.base + 'controller.js')

	controller.regRender(renderWorker)

	if (!fs.existsSync(config.path.compiledViews)){
		require('child_process').execSync('mkdir -p ' + config.path.compiledViews)
	}
	EchoStream = require(config.path.lib + 'stream.js').write
}

function renderWorker(req ,res ,opt , context){
	opt = opt || {}
	processStack(middleware_after, req ,res , opt.virtualHostName, context , function(next_err, next_val){

		if (!next_val || !next_val.body) next_val = context
		res.writeHead( next_val.status, next_val.header )
		res.write( next_val.body)
		res.end()
	})
	
}

function processStack(middleware , request ,response , virtualHostName , init_val , done){
	var cur = 0
	function handleConnectStack(err ,val){
		var connect = middleware[cur]
		function callNextConnect(err ,val){
			cur++
			handleConnectStack(err ,val)
		}	
		if (connect && connect.host && virtualHostName !== connect.host) return callNextConnect() 
		if (connect && connect.urlRegTest  ){
			if (typeof connect.urlRegTest.test === 'function') {
				var url_test = connect.urlRegTest.test(request.url)
				connect.urlRegTest.lastIndex = 0
				if (!url_test) return callNextConnect()
			}else if ('string' === typeof connect.urlRegTest) {
				if (request.url.indexOf(connect.urlRegTest) !== 0  ) return callNextConnect()
			}
		}

		if (!connect)  {
			return done(err, val)
		}else{
			connect.conntion(request ,response , function(next_err , next_val){
				callNextConnect(next_err ,next_val)
			},val)
		}

	}
	handleConnectStack(null , init_val)
}

function route(request ,response ) {
    //console.log('%s / %s' ,request.headers.host  , request.url )
	try{
		var reqUrl  = url.parse('http://' + request.headers.host  + request.url , true)
	}catch(err){
		console.log ('Route Parse Error:' , request.url)
		response.writeHead(500 , {'Content-Type' : 'text/plain'})        
	    response.end('url is wrong')
		return	
	}

    var virtualHostName = config.virtualHost[reqUrl.hostname]
	if (!virtualHostName){
		console.log ('Route Parse Error:' , request.headers.host)
		response.writeHead(500 , {'Content-Type' : 'text/plain'})        
	    response.end('host miss')
		return	
	}
	
	processStack(middleware_before , request ,response , virtualHostName , null ,function(){
		 handleRoute(request ,response , virtualHostName , reqUrl)
	})
	
	//handleRoute(request ,response)
}
function handleRoute(request ,response , virtualHostName  , reqUrl){
    //TODO 根据一级目录查找hostPath
	var hostPath =   virtualHostName || ''
	if (hostPath) hostPath += SEP 

    var reqPath =   reqUrl.pathname.substr(1)
	//有后缀名的是静态文件 pipe to static
	var suffix = path.extname(reqPath)
    var suffix_conf = config.etc.compile[suffix]

	if (suffix  ) {
		if (response.setHeader && ['.ttf' , '.woff','.eot' , '.svg'].indexOf(suffix) !== -1) response.setHeader('Access-Control-Allow-Origin' , '*')
        // 查找对应compiler    
        if (response.setHeader && suffix_conf) response.setHeader('content-type', suffix_conf.contentType || 'text/plain')

        var staticCompiler = suffix_conf && suffix_conf.compiler 
        if (staticCompiler) staticCompiler = path.resolve(config.path.staticCompiler , staticCompiler) 

		function echoError(err){
			response.writeHead(404)
			response.end(err.toString())
		}

		function comboFile(files ,literal , done){

			files = files.slice(0, - suffix.length).split(',')
				
			var files_count = files.length
				,combined_count_down  = files_count 
			if (!files_count) return echoError('file name not assign')
			files.forEach(function(file){
				file = filterFilePath(file) 
				if (!file) return combined_count_down--
				file += suffix
				var pipe_stream = files_count > 1 ? (new EchoStream({'cbk' : function(content){
					response.write(content)
					combined_count_down--
					if (combined_count_down <=0 ) {
						response.end()
						done && done()
					}
				}})): response
				literal(file, pipe_stream)
			})
		}
		function filterFilePath(file){
			return file.replace(/\.\.\//g,'').replace(/^\//g,'')
		}
		var static_root_path = path.resolve(config.path.appPath  , hostPath , 'static')
        if (config.etc.compiler && '~' === reqPath.slice(0,1) ){
			reqPath = reqPath.slice(1)
		   	fs.stat(staticCompiler ,function(err, stats)  {
				if (err) {
					return echoError('comipler lost') 
				}

				var CompilerInst = require(staticCompiler)
				comboFile(reqPath , function(file , read_to){
					CompilerInst.compile(
						{ 'modPath' : static_root_path , 'mods' : file} 
						, function(err , context){
							if (err) {
								echoError(err)
							} else {
								read_to.end(context.toString())
							}
						}
					)
				})
					
			})
            
        } else { 
			function readFile(file ,read_to ){
				read_to = read_to || response
				fs.createReadStream(path.resolve(static_root_path , file))
					.on('error' , echoError)
					.pipe(read_to)
			}
			if (['.js' , '.css'].indexOf(suffix) === -1) return readFile(filterFilePath(reqPath))
			comboFile(reqPath ,readFile )
         }
		return
	}

    request.__get = {}
	for (var k in reqUrl.query){
		request.__get[k.replace(/[<>%\'\"]/g,'')] = reqUrl.query[k]
	}
    request.__post = {}


	reqPath = reqPath || config.etc.hostDefault[virtualHostName]  || ''
	var modUriSeg = reqPath.replace(/\/+/g,'/')
							.replace(/\/$/,'')
							.split('/')
	/*
	url 格式 [/ 地址/...]模块文件名/方法名/[参数] 
	最后的/后面无参数则被忽略
	3 mod/fn/param
	2 mod/../param
	1 mod
	*/
	if (modUriSeg.length < 3){
		modUriSeg.splice(1,0,'index')
	}
	var mods = modUriSeg.splice(-3)
	//console.log(mods)

	modPath = config.path.appPath  + hostPath + SEP + 'controller' +
             SEP  + (modUriSeg.length ? modUriSeg.join(SEP) + SEP  : '')
	delete modUriSeg 
	
	var modName = mods[0] + '.js'
	var modFilePath = modPath + modName
	if (!lookuped[modFilePath] && !fs.existsSync( modFilePath)){
		base.accessLog(404 , request  )
			response.writeHead(404 , {'Content-Type' : 'text/plain'})        
			response.end('404')
	}else{
		lookuped[modFilePath] = true
		var mod = require ( modFilePath)
		var fn = mods[1]
		var param = mods.length == 3 ? mods[2] : null
		if (param) {
			try {
				param = decodeURIComponent(param)
			} catch(err) {
				console.log(err, param)
			}
		}
		if (mod.__pipe){
			return pipeRes(request , response , mod.__pipe,fn , param) 
		}
		if ('function' != typeof mod[fn] &&
				'function' == typeof mod['__create']){
			mod = mod.__create(modName , hostPath)
		}
		if ('function' == typeof mod[fn] ){
			//base.accessLog(200 , request  )
			exeAppScript(hostPath ,virtualHostName , request , response , mod ,fn , param)	
		}else if (mod.__call){
			exeAppScript(hostPath ,virtualHostName , request , response , mod , '__call' , fn , param)
		}else {
			base.accessLog(404 , request, modFilePath + ' not assign'  )
				response.writeHead(404 , {'Content-Type' : 'text/plain'})        
				response.end('not assign.')	

		}

	}
}
function pipeRes(request , response , mod , fn , param){
    var http = require('http')
    if (!mod[fn]) {
        response.setHeader(404)
        response.end('pipe miss')
        return 
    }  
    var hosts = config.api.hosts || {}
    var description = mod[fn]  
    var url = description.url 
        ,host = hosts[description.host || 'web'] || description.host
  
    
    var query = querystring.stringify(request.__get)
    if (query){
        url += (url.indexOf('?') >0 ? '&' :'?') + query
    }
    request.pause()

    var options = {} 

    options.headers = description.headers || request.headers
    options.method = description.method || request.method
    options.agent = false

    options.host = host 
    options.port = description.port || 80
    options.path = url

    options.headers.host = host
    options.headers.reqHost = request.headers.host
    options.headers.requrl = request.url

    var connector = http.request(options, function(serverResponse) {
        serverResponse.pause()
        response.writeHeader(serverResponse.statusCode, serverResponse.headers)
        serverResponse.pipe(response)
        serverResponse.resume()
    })
    connector.on('error' , function(err){
        response.writeHeader(500,err)
        response.end()
    })

    request.pipe(connector)
    request.resume()   
}

function exeAppScript(hostPath ,virtualHostName , request , response , mod , fn , param , param2){
	
	 function toExe (){
	    mod.setRnR && mod.setRnR(request , response ,{"hostPath" : hostPath ,"virtualHostName" : virtualHostName ,'handleRoute':handleRoute})

        //console.log(mod[fn]);
		try { 
			mod[fn](param , param2)   
		}catch (err){
			base.dataErrLog(500 , request,  'Fatal error :'+ err  )
			response.writeHead(500)
			response.end( 'Fatal error :' + err)
		}
        //mod[fn].call(mod , param);
	}
  	if ('POST' == request.method){
		var data = ''

		request.addListener(
			'data' 
			, function(chunk){
				data += chunk
				if (data.length > 1e6) request.connection.destroy()
			})
			.addListener('end' ,function(){
				if (request.headers && request.headers.accept && request.headers.accept.indexOf('application/json') >=0 && data.slice(0,1) === '{') {
					//json api
					data = JSON.parse(data)
				}else{
					data = querystring.parse(data)
				}

				request.__post = data
				toExe()
			}
		)
	}else{
		toExe()
	}

}

exports.route = route
exports.setGlobal = setGlobal 
exports.connect = registConnect
