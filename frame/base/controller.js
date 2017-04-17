//var jst = require('jst');
var util = require("util")
	, events =  require("events");
var est = require(config.path.lib + 'est/est.js');
var callApiLib = require(config.path.base + 'remoteApi.js') 
var querystring = require('querystring') 
	, path =  require("path")
	, url =  require("url")
	, fs =  require("fs")

var siteInfo =  config.site
var eventLib = require(config.path.base + 'evtHandle.js')
eventLib.prepareData(siteInfo)

var cookieHandle = require(config.path.base + 'cookie.js') 
var apiShrink = require(config.path.lib + 'api/shrink.js')
	,EchoStream = require(config.path.lib + 'stream.js').write

var ServerHead = 'hornbill living in ' + config.etc.hostID

est.setOption({
	watchingTpl : config.etc.watchingTpl,
	fuss : config.etc.fussTpl,
    compiledFolder : config.path.compiledViews })

var jsDepCache = {}
	,tplPreCache = {}

var sendToRender


//模拟数据 在controller里 调用bridgeMocks注册
function mockApi(mock_uri , opt){
	opt = opt || {}
	var req = opt.req
		,auto = opt.auto
		,bridge = opt.bridge
	var api_path = path.join(config.path.appPath , opt.host , config.path.mock || 'mock'  , mock_uri) 
		
	return function(evt,passData){
		//api(evt , passData||data)
		fs.stat(api_path , function(err ,stat){
			if (err) {
				if (auto && bridge) {
					//模拟数据不存在的时候自动生成
					var api_time = new Date
					bridge(function(api_data){
						evt(api_data)
						try{
							require('child_process').execSync('mkdir -p ' + path.dirname(api_path))
							fs.writeFile(api_path,JSON.stringify({
								"response" : api_data,
								"delay": new Date - api_time,
								"status": false === api_data ? 400 : 200,
							}))
						}catch(err){
							base.errorLog('error' , 'mock' , api_path  )
									
						}
					})
					return	
				}else {
					return evt(false)
				}
			}
			var api = require(api_path)
			if ('function' === typeof api){		
				var api_result = api(req)
			}else {
				var api_result = api
			}
			if (!('response' in api_result)){
				api_result = {'response' : api_result}
			} 
			
		
			var res_state = api_result.status || 200

			var remoteUri = 'mock::' + mock_uri
			if  (200 != res_state && 400 != res_state && 4000 > res_state) { 
				base.errorLog('error' , 'api' , remoteUri , 'STATUS: ' , res_state )
				return evt(false) 
			}
			if (api_result.delay >= config.api.timeout) {
				base.errorLog('error' , 'api' , remoteUri , 'Request Timeout' )
				setTimeout(function(){
					evt(false) 
				} , config.api.timeout)
				return 
			}
			/*
			* response
			* delay 
			* status 
			* code
			* error {message}
			*/
			
			var api_res=  {'code' : api_result.code || 0 , 'data' : api_result.code ?api_result.error.message : api_result.response}
			
			setTimeout(function(){
				evt(api_res)
			} , api_result.delay || 0 )
		})
	}

}

function writeRes (req , res , opt , status , body, header , debugStr){		
	if (res.headersSent){
		return console.log('header had been send' ,null , new Date, debugStr || '')
	}
	try{
		sendToRender(req , res , opt, {
			'status' : status,
			'header' : header || {'Content-Type': 'text/plain','Cache-Control': 'no-cache,no-store' ,  'serv    ice' :ServerHead },
			'body' :body 
		})
		
		/*
		res.writeHead( status, header || {'Content-Type': 'text/plain','Cache-Control': 'no-cache,no-store' ,  'service' :ServerHead })
		res.write( body)
		res.end()
		*/
	}catch(err){
		console.log('write res error' ,err , new Date, debugStr || '')
	}

}
function Controller(){

}
function bindDefault(arg1 ,arg2){
	require( config.path.appPath + this.opt.hostPath +  config.path.model + 'defaultControl.js').bind.call(this , arg1 , arg2)
}

Controller.prototype = {
	bindDefault : bindDefault,  
	setDefaultData :  bindDefault ,
	setMDefault :  bindDefault ,
	loadModel : function (modName , host){
		if (host) host += '/'
		return require (config.path.appPath + (host || this.opt.hostPath) +  config.path.model + modName )
	},

		
    siteInfo : siteInfo,
	setRnR : setRnR,
	render : render,
	index : index,
    ajaxTo : ajaxTo,
	errorPage : function(code){
		if (!code ) code = 404

		base.accessLog(code, this.req , 'error page raise')
		writeRes(this.req , this.res , this.opt, code , code +'')
		},
    redirectTo : function(url , proxyArgs ,opt){
		opt = opt || {}
		var args
		if (proxyArgs){
			args = this.req.__get
		}
		if (opt.r){
			var appMod = require(config.path.base + 'tools.js')
			args = {"_or" : appMod.genToken(opt.r)}	
		}
		if (args){
		    args = require('querystring').stringify(args)
	        if (args) url += (url.indexOf('?')>0 ? '&' :'?') + args
		}
		writeRes(this.req , this.res ,this.opt,  301 , '' ,{
            'Location' : url,
			'Cache-Control' : 'no-cache,must-revalidate,no-store',
			'Pragma' : 'no-cache'
		} )
		return false
        
	},
    getApi : function(remoteUri,reqAct , method ,rawData){
        return callApiLib.__create(this.req , this.res ,this.notify)(remoteUri , method || this.req.method , reqAct ,rawData); 
    },
	bridgeMocks : function(php){
		//判断config开关
		if (config.etc.mockOff) return false	
		this.mock_api = php	
	},
	autoGenMock : function(auto){
		if (config.etc.mockOff) return false	
		this.mock_api_auto = !!auto
		
	},
	bridgeMuch : function(php , opt){
		opt = opt || {}
		var method = opt.method
			,raw = opt.raw

		var mock_api = config.etc.mockOff ? {} : this.mock_api || {}
			,mock_api_auto = this.mock_api_auto 
		for (var k in php){
			var client  = this.bridge( php[k] ,undefined , method , raw)
			if (mock_api[k]) {
				var phpClient = mockApi( mock_api[k] , {
					'auto': mock_api_auto,
					'bridge' : this.bridge( php[k]),
					'req' :  this.req , 
					'host' : this.opt.hostPath })
			}else{
				var phpClient = client
			}
			this.listenOn(phpClient , k)()
		}
		this.req.dataSource = php
	},
    bridge : function(remoteUri ,reqAct , method, rawData){
        var data =  this.req.__get;
        if ( this.req.method == 'POST'){
			var querys = querystring.stringify(this.req.__get)
            if (querys) remoteUri +=  (remoteUri.indexOf('?') > 0 ?'&' : '?') + querys 
			data = this.req.__post 
        }
        var api = this.getApi(remoteUri , reqAct , method ,rawData)
        return function(evt,passData){
        	api(evt , passData||data)
        }
        
    },
	listenOn : function( toCallMethod , assignTag ){
        var mSelf = this
        return function(){
            var args = Array.prototype.splice.call(arguments , 0)
            return mSelf.eventHandle.listenOn( toCallMethod , assignTag , args)
		}
	} ,
	listenOver : function(callBack , noPrepare){
        var mSelf = this;
	    var opt = {}	
        if (base.isObject(noPrepare)){
            opt = noPrepare
        }else{
            opt.noPrepare = noPrepare
        }
		function cbk(data , err){
			if (!err){ 
                //api结构析构
                if (opt.shrink && apiShrink) {
                    var error_from_api = apiShrink.parse(data)
                }
				if (mSelf._prevData){
					data = base.array_merge(mSelf._prevData , data)
					delete mSelf._prevData
				}
        
				callBack.call(mSelf , data , error_from_api || {})
			}else{
				writeRes(mSelf.req , mSelf.res , mSelf.opt , 503 ,'error raised' , null , mSelf.req.url)
				var splitor = "\n--->\n"
				base.dataErrLog(splitor + new Date() 
				+ splitor + 'url:'+ mSelf.req.url 
				+ splitor + err.stack + "\n<---\n")
				}
			}
        //return this.eventHandle.listenOver(callBack,noPrepare) ;
        return this.eventHandle.listenOver(cbk,opt.noPrepare) 
    }
}
function setRnR (req ,res , opt){


     this.req = req
     this.res = res
     this.cookie = cookieHandle.getHandler(req ,res) 
     var client_ip = req.headers['x-forwarded-for'] || req.headers['http_client_ip'] ||  req.headers['x-real-ip'] || req.connection.remoteAddress
	 this.opt = opt ||{}

	 this.req.headers.clientIp = client_ip
}

/*
*ajax桥
* @param string php uri
* @param function
* @param string GET|POST
*/
function ajaxTo(url, callBack , method){
	var res = this.res
		,req = this.req
		,opt = this.opt
	var only_one =  'string' == typeof url 
	if (!callBack ) {
		callBack = function(data , res_state){ 
			var status =   false === data ?400: 200
			if (4000 <= res_state)  status = res_state

			if (false === data) data = ''
			else if ( only_one) data =  data.ajaxTo
			data = JSON.stringify(data)

			if (req.__get.callback) {	//for jsonp
				data = req.__get.callback + '(' + data + ')';
			}


			writeRes(req , res , opt ,status , data ,{'Content-Type': 'application/json; charset=utf-8'
				,'Cache-Control': 'no-cache,no-store'
					,'service' :ServerHead })
		base.accessLog(status, req , new Date - req.__request_time)
		}
	}


	if (only_one ){
		//var php = this.bridge(url,undefined , method , true);
		//php(callBack);
		url = {'ajaxTo' : url}
	}
	this.bridgeMuch(url , {'method' : method ,'raw' : true})
	this.listenOver(callBack,true);
}

function render(tplName , data , callBack){
	//var tplName = config.path.views + this.hostPath + tplName;
    // var st = new Date;
	if (this.req.__get['__pd__']){
		//show snake data  
		var now = new Date()
		if ( this.req.__get['__pd__'] == '/rb/' + (now.getMonth() + now.getDate() + 1)){
			writeRes(this.req , this.res ,this.opt,  200 ,JSON.stringify(data) )
			base.accessLog(201, this.req , 'data debug')
			return	
			}
		}
    var self = this
	if ('function' != typeof callBack){
		var res = this.res
			,req = this.req
			,opt = this.opt

		function readFromRemote(url){
			var api = callApiLib.__create(req , res , null , {'remoteHtml' : true,'noAutoHeaders': true} )(url , 'GET' , null ,true)
			 return function(evt){
				 api(evt  )
			 }
		}
		function readStaticFile(file , type){
			var suffix = path.extname(file)
			if (!suffix) return

			if (!type) type = suffix.slice(1)
			return function(evt){
				var response = new EchoStream({
					'extend' : {
						'setHeader' : function(){},
						'writeHead' : function(status_code,headers){
							if (200 != status_code) evt(file + ' not exits')
						}
					},
					'cbk' : function(content){
						switch(type){
							case 'js':
								content = '<script type="text/javascript">\n' + content + '\n</script>'				
								break
							case 'css':
								content = '<style type="text/css">\n' + content + '\n</style>'				
								break
						}
						evt(null , content )
					}
				}) 
				opt.handleRoute(req ,response , opt.virtualHostName, {'pathname' : '/' + file}) 
			}
		}

		callBack = function(err , html){
			if (html && html.html){
				//object
				//
				var _before_html = html.html
				if (html.remote_to_include){
					var rti_event = eventLib.__create()
					for (var placeholder in html.remote_to_include){
						var  include_opt = html.remote_to_include[placeholder]
						if (include_opt.url){
							var toCallMethod = readFromRemote(include_opt.url)
							rti_event.listenOn( toCallMethod , placeholder,[])
						}else if (include_opt.staticMod){
							var toCallMethod = readStaticFile(include_opt.staticMod , include_opt.type)	
							if (toCallMethod) rti_event.listenOn( toCallMethod , placeholder,[])
						}
					}
					rti_event.listenOver(function(remotes){
						for (var placeholder in remotes){
							var remote_html = remotes[placeholder]
							if (false === remote_html){
								var  include_opt = html.remote_to_include[placeholder]
								remote_html = '<!--call remote : ' + include_opt.url  + ' fail-->'
							}else{
								remote_html = remote_html.toString()
							}
							remote_html = '\n' + remote_html + '\n'
							_before_html = _before_html.replace(placeholder, remote_html)				
						}
						callBack(null , _before_html)
					}, true)
					return
					//TODO remote include替换 
				}
				html = _before_html 
			}

			if (!err) {
				//html += '<script>var l={};l.req=' + req.__request_time.getTime() + ';l.h=' + (new Date).getTime()+ '</script>'
				writeRes(req , res ,opt, 200 , html , {'Content-Type': 'text/html;charset=utf-8' , 'Cache-Control': 'no-cache,no-store' ,'service' :ServerHead} , req.url)
			}else{
				writeRes(req ,res ,opt,  503 ,'error raised' , null , req.url)
			}
			base.accessLog(err? 503 : 200, req , new Date - req.__request_time)
		}
	}

	var tplPre = tplPreCache[this.hostPath] || (tplPreCache[this.hostPath] = this.hostPath.replace(/\//g,'').replace(/\\/g,'') );
	if (!data) data = {}

	data['_Request_query'] = this.req.__get
	data['_Request_cookies'] = this.req.__cookies
	data['_Request_ua'] = this.req.headers['user-agent']
	data['_Request_host'] = this.req.headers.host
	data['_Request_raw'] = {'url': this.req.url 
		, 'dataSouce' : this.req.dataSource||{}
		,'query' : this.req.__get};

	var tplPath = config.path.appPath +   this.hostPath + config.path.views

		est.renderFile(tplPath ,tplName , data , callBack , tplPre );
	//jst.renderFile(tplName, data , callBack );

}

function index(){
	this.res.end('index page');
}

exports.__create = function (mod , extFn){
	if(undefined === extFn){
        extFn = mod
        mod = function(){return this}
    }
	util.inherits(mod, Controller)
	if (extFn ) { 
		for (var k in extFn)  mod.prototype[k] = extFn[k]
	}
			
	return function(modName, hostPath){
		modObj =  new mod	

        modObj.eventname = modName
        modObj.hostPath = hostPath
        //modObj.eventHandle = eventLib.__create(modName ,siteInfo);
        modObj.eventHandle = eventLib.__create()

		return modObj
	}
}
exports.regRender = function(fn){
	sendToRender = fn
}
