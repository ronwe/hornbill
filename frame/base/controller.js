//var jst = require('jst');
var util = require("util")
	, events =  require("events");
var est = require(config.path.lib + 'est/est.js');
var callApiLib = require(config.path.base + 'remoteApi.js'); 
var querystring = require('querystring'); 
var siteInfo =  config.site;
var eventLib = require(config.path.base + 'evtHandle.js');
eventLib.prepareData(siteInfo);

var cookieHandle = require(config.path.base + 'cookie.js') 
var apiShrink = require(config.path.lib + 'api/shrink.js')

var ServerHead = 'hornbill living in ' + config.etc.hostID

est.setOption({
	watchingTpl : config.etc.watchingTpl,
	fuss : config.etc.fussTpl,
    compiledFolder : config.path.compiledViews });

var jsDepCache = {};

var tplPreCache = {};
function writeRes (res , status , context, header , debugStr){		
	if (res.headersSent){
		return console.log('header had been send' ,null , new Date, debugStr || '')
	}
	try{
		res.writeHead( status, header || {'Content-Type': 'text/plain','Cache-Control': 'no-cache,no-store' ,  'service' :ServerHead });
		res.write( context)
		res.end()
	}catch(err){
		console.log('write res error' ,err , new Date, debugStr || '')
	}

}
function Controller(){

}
function bindDefault(php){
	require( config.path.appPath + this.opt.hostPath +  config.path.model + 'defaultControl.js').bind.apply(this , arguments)
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
		writeRes(this.res , code , code +'')
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
		writeRes(this.res , 301 , '' ,{
            'Location' : url,
			'Cache-Control' : 'no-cache,must-revalidate,no-store',
			'Pragma' : 'no-cache'
		} )
		return false
        
	},
    getApi : function(remoteUri,reqAct , method ,rawData){
        return callApiLib.__create(this.req , this.res ,this.notify)(remoteUri , method || this.req.method , reqAct ,rawData); 
        },
	bridgeMuch : function(php){
		for (var k in php){
			var phpClient = this.bridge( php[k]);
			this.listenOn(phpClient , k)();
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
				writeRes(mSelf.res , 503 ,'error raised' , null , mSelf.req.url)
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
     if (!callBack ) {
        callBack = function(data , res_state){ 
			 var status =   false === data ?400: 200
			 if (4000 <= res_state)  status = res_state

			 if (false === data) data = ''
			 else if ( 'string' != typeof url) data = JSON.stringify(data)
			 else data += ''
			 
		
			 writeRes(res , status , data ,{'Content-Type': 'application/json; charset=utf-8'
                                        ,'Cache-Control': 'no-cache,no-store'
                                        ,'service' :ServerHead })
			 base.accessLog(status, req , new Date - req.__request_time)
		 }
	 }

    if (config.api.spamhost && !req.__get.callback && 'string' == typeof url) {
    	url = {
    		'oragin' : url
    	}
    	var tempCbk = callBack;
        callBack = function(data) {
            tempCbk(data.oragin)
        }
    }

	if ( 'string' == typeof url){
		var php = this.bridge(url,undefined , method , true);
		if (req.__get.callback) {	//for jsonp
			var cbk = callBack;
			callBack = function(data) {
				data = req.__get.callback + '(' + data + ')';
				cbk(data);
			}
		}
		php(callBack);
	}else {
		this.bridgeMuch(url);
		this.listenOver(callBack,true);
	}
}

function render(tplName , data , callBack){
	//var tplName = config.path.views + this.hostPath + tplName;
    // var st = new Date;
	if (this.req.__get['__pd__']){
		//show snake data  
		var now = new Date()
		if ( this.req.__get['__pd__'] == '/rb/' + (now.getMonth() + now.getDate() + 1)){
			writeRes(this.res , 200 ,JSON.stringify(data) )
			base.accessLog(201, this.req , 'data debug')
			return	
			}
		}
    var self = this
	if ('function' != typeof callBack){
		var res = this.res
			,req = this.req
		callBack = function(err , html){
                if (!err) {
					//html += '<script>var l={};l.req=' + req.__request_time.getTime() + ';l.h=' + (new Date).getTime()+ '</script>'
					writeRes(res , 200 , html , {'Content-Type': 'text/html;charset=utf-8' , 'Cache-Control': 'no-cache,no-store' ,'service' :ServerHead} , req.url)
                }else{
					writeRes(res , 503 ,'error raised' , null , req.url)
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
