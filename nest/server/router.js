var fs = require("fs"),
    url = require('url'),
    path = require('path'),
    querystring = require('querystring')
var config = require('./config.js') 

config.setAbsPath( __dirname.replace(/\\/g,'/') )
global.config = config
global.base = require(config.path.base + 'base.js')
global.controller = require(config.path.base + 'controller.js')


var lookuped = {}

function route(request ,response ) {
    //console.log('%s / %s' ,request.headers.host  , request.url );
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
	if (hostPath) hostPath += '/' 


    var reqPath =   reqUrl.pathname.substr(1)
	//有后缀名的是静态文件 pipe to static
	var suffix = path.extname(reqPath)
    var suffix_conf = config.etc.compile[suffix]
	if (suffix  ) {
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


	modPath = config.path.appPath  + hostPath + '/controller/'  + (modUriSeg.length ? modUriSeg.join('/')+'/' : '')
	delete modUriSeg 
	
	var modName = mods[0] + '.js'
	var modFilePath = modPath + modName
    if (!lookuped[modFilePath] && !fs.existsSync( modFilePath)){
			base.accessLog(404 , request  )
			response.writeHead(404 , {'Content-Type' : 'text/plain'});        
		    response.end('404');
    }else{
			lookuped[modFilePath] = true;
		    var mod = require ( modFilePath);
		    var fn = mods[1];
		    var param = mods.length == 3 ? mods[2] : null;
		    if (param) {
				try {
					param = decodeURIComponent(param);
				} catch(err) {
					console.log(err, param);
				}
			}
			//console.log(mod , fn);
		    if ('function' != typeof mod[fn] &&
		        'function' == typeof mod['__create']){
			    mod = mod.__create(modName , hostPath);
			}
		    if ('function' == typeof mod[fn]){
				//base.accessLog(200 , request  )
			    exeAppScript(hostPath ,request , response , mod ,fn , param);	
		    }else {
				base.accessLog(404 , request, modFilePath + ' not assign'  )
				response.writeHead(404 , {'Content-Type' : 'text/plain'});        
			    response.end('not assign.');	

		    }
            
     }
}


function exeAppScript(hostPath ,request , response , mod , fn , param){
	
	 function toExe (){
	    mod.setRnR && mod.setRnR(request , response ,{"hostPath" : hostPath})
        //console.log(mod[fn]);
		try { 
			mod[fn](param)   
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
