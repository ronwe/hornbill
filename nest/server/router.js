var fs = require("fs"),
    url = require('url'),
    path = require('path'),
    querystring = require('querystring')
var config = require('./config.js') 

//config.setAbsPath( __dirname.replace(/\\/g,'/') )
config.setAbsPath( __dirname)
global.config = config
global.base = require(config.path.base + 'base.js')
global.controller = require(config.path.base + 'controller.js')

const SEP = path.sep
if (!fs.existsSync(config.path.compiledViews)){
    require('child_process').execSync('mkdir -p ' + config.path.compiledViews)
}
var lookuped = {}

function route(request ,response ) {
    // console.log('%s / %s' ,request.headers.host  , request.url );
	try{
		var reqUrl  = url.parse('http://' + request.headers.host  + request.url , true)
	}catch(err){
		console.log ('Route Parse Error:' , request.url)
		response.writeHead(500 , {'Content-Type' : 'text/plain'})        
	    response.end('url is wrong')
		return	
	}

    var virtualHostName = config.virtualHost[reqUrl.hostname]
    //TODO 根据一级目录查找hostPath
	var hostPath =   virtualHostName || ''
	if (hostPath) hostPath += SEP 


    var reqPath =   reqUrl.pathname.substr(1)
	//有后缀名的是静态文件 pipe to static
	var suffix = path.extname(reqPath)
    var suffix_conf = config.etc.compile[suffix]
	if (suffix  ) {
		if (['.ttf' , '.woff','.eot' , '.svg'].indexOf(suffix) !== -1) response.setHeader('Access-Control-Allow-Origin' , '*')
        // 查找对应compiler    
        if (suffix_conf) response.setHeader('content-type', suffix_conf.contentType || 'text/plain')

        var staticCompiler = suffix_conf && suffix_conf.compiler 
        if (staticCompiler) staticCompiler = path.resolve(config.path.lib ,'compiler' , staticCompiler) 
        if (config.etc.compiler && '~' === reqPath.slice(0,1)  && fs.existsSync( staticCompiler ) ) {
            require(staticCompiler).compile(
                { 'modPath' : config.path.appPath  + hostPath + '/static/' , 'mods' : reqPath.slice(1)  } 
                , function(err , context){
                if (err) {
                    response.writeHead(404)
                    response.end(err.toString())
                } else {
                    response.end(context.toString())
                }
            })
            
        } else { 

            var staticFile = config.path.appPath  + hostPath + '/static/'  + reqPath
            fs.createReadStream(staticFile)
                .on('error' , function(err){
                    response.writeHead(404)
                    response.end(err.toString())
                })
                .pipe(response)
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
			    exeAppScript(hostPath ,request , response , mod ,fn , param)	
		    }else if (mod.__call){
			    exeAppScript(hostPath ,request , response , mod , '__call' , fn , param)
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


function exeAppScript(hostPath ,request , response , mod , fn , param , param2){
	
	 function toExe (){
	    mod.setRnR && mod.setRnR(request , response ,{"hostPath" : hostPath})
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
				data = querystring.parse(data)

				request.__post = data
				toExe()
			}
		)
	}else{
		toExe()
	}

}

exports.route = route
