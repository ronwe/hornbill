var http = require('http'),
	url = require('url');
var querystring = require('querystring'),
	keepAliveAgent = require(config.path.lib + 'agent.js'),
	cookie = require(config.path.base + 'cookie.js')

var hosts = config.api.hosts || {}, 
	port = config.api.port || 80, 
	debug = config.api.debug;

var agent = config.etc.maxSockets ? new keepAliveAgent({ maxSockets: config.etc.maxSockets }) : false

function create(req ,res , notify ,lib_opt) {
	lib_opt = lib_opt || {}
	var proxyDomain = config.api.ProxyHeaders || ['x-requested-with','XREF', 'clientIp' , 'referer' , 'cookie' , 'user-agent' ]
    return function(remoteUri , method, reqAct , rawData){
		var reqHeaders = reqAct ? {'request' : reqAct} : {}
		var lib_http_option
		if (!method ) { method = 'GET'}
		var hostSource = 'web'
		var noUriAutoAppend = false


		if (lib_opt.remoteHtml){
			try{
				lib_http_option = url.parse(remoteUri)
				var host = lib_http_option.host
			}catch(err){}
		} else if (base.isObject(remoteUri)){
			hostSource = remoteUri.host || hostSource				

			var strict_post_data = remoteUri.post
				,strict_get_data = remoteUri.get
			if (strict_get_data){
				noUriAutoAppend = true	
			}
			if (strict_post_data){
				method = 'POST'
			}
			remoteUri = remoteUri.url
			var host = hosts[hostSource]	

		} else {
			if (remoteUri.indexOf('::') > 0){
				remoteUri = remoteUri.split('::')
				hostSource = remoteUri[0]
				remoteUri = remoteUri[1]
			}
			var host = hosts[hostSource]	
		}
		if (!host){
			var splitor = "\n--->\n"
			var errLogTxt = splitor + new Date()
			+ splitor + 'url:'+ req.url
			+ splitor + 'apiUrl:' + remoteUri 
			+ splitor + 'Data Source: ' + hostSource +  ' is not configed' + "\n<---\n"
			host = config.api.host	
		}
		var _origin_remoteUri = remoteUri

        return function(evt , data ) {
			if (errLogTxt){
				base.dataErrLog(errLogTxt)			
			}
			if (!host)   return evt ? evt(false) : {};
			var remoteUri = _origin_remoteUri

			if ('undefined' == typeof data && 'function' != typeof evt){
				data = evt
				evt = null
			}
			if (strict_post_data) {
				//设置了post数据
				data = strict_post_data 
			}

            var data = querystring.stringify(data)
			var proxyHeaders = reqHeaders

			if (!lib_opt.noAutoHeaders){
				proxyHeaders.reqHost = req.headers.host
				proxyHeaders.requrl = req.url
				proxyHeaders.targetEnd = hostSource
				for(var i=0,j = proxyDomain.length ; i < j ;i++ ){
					if (req.headers.hasOwnProperty(proxyDomain[i]) ) {
						proxyHeaders[proxyDomain[i]] = req.headers[proxyDomain[i]]
					}
				}
			}
           
			remoteUri = remoteUri.trim()
			if ('&$' ==  remoteUri.slice(-2)) {
				remoteUri = remoteUri.slice(0,-2) 
				noUriAutoAppend = true
			}
			var append2Uri = ''
			if (strict_get_data) {
				append2Uri = querystring.stringify(strict_get_data)
			}
            if ('GET' == method){
				if (false === noUriAutoAppend && data){
					append2Uri = append2Uri? ( data +  '&'  + append2Uri ) : data
				}
                data = ''
			}else{
				proxyHeaders['Content-Type'] =  'application/x-www-form-urlencoded'
			}
			if (append2Uri) {
				remoteUri += (remoteUri.indexOf('?')>0 ? '&' : '?') + append2Uri 
			}
            proxyHeaders['Content-Length'] =  Buffer.byteLength(data,'utf8') 
                    
            var http_options = lib_http_option || {
                 host : host,
                 port : port ,
                 headers: proxyHeaders,
                 path : remoteUri,
                 agent : agent,
                 method : method ,
            }
			console.log(http_options)
            var request_timer
            var st1 = new Date;
            var request = http.request(http_options, function(response) {
				request_timer && clearTimeout(request_timer)
				request_timer = null
				//console.log('STATUS: ' + response.statusCode);
				//response.setEncoding('utf8');

				var res_state = response.statusCode;
				if  (200 != res_state && 400 != res_state && 4000 > res_state) { 
					base.errorLog('error' , 'api' ,remoteUri , 'STATUS: ' , res_state )
					return evt(false) 
				}
				var result = '';
				var buff = []
				response.on('data', function (chunk) { 
					buff.push(chunk)
				}).on('end' , function(){
					result = Buffer.concat(buff)

					 if (400 == res_state){
						base.errorLog('error' , 'api' ,remoteUri , '400: ' , result )
						return evt(false); 
						 }

					if ('""' == result) result = false 
					if (debug) {
						try{	
							var result_orgin = result;
							//result = result ? (JSON.parse(result) || result) : false;
							result = rawData ? result : (result ? (JSON.parse(result) || result) : false)
						}catch(err){
							base.errorLog('error' , 'api' ,remoteUri , 'API ERROR:' , result_orgin )
							}
					}else{
						result = rawData ? result : (result ? (JSON.parse(result) || result) : false)
					}
					var runlong = new Date - st1;
					if (runlong > 500) 	base.errorLog('warning' , 'api' ,remoteUri , '>500: ' , runlong )
					if (!lib_opt.noAutoHeaders)	{
						var proxyDomains = ['set-cookie']
						for (var i = proxyDomains.length-1;i>=0 ;i--){
							var proxyKey = proxyDomains[i]
							if (proxyKey in response.headers){
								var pdVal = response.headers[proxyKey]
									if (!pdVal) break
									if ('set-cookie' == proxyKey) {
										var cookie_set = cookie.getHandler(req , res)
										pdVal.forEach(function(cookie_v){
											cookie_set.set(cookie_v)
										})
									}else {
										res.setHeader( proxyKey , pdVal)
									}

							}
						}
					}
					return evt ? evt(result ) : result;
				})
			})
            request.on('error' , function(e){
				base.errorLog('error' , 'api' ,remoteUri , e.message )
                evt && evt(false)
            })
            request_timer = setTimeout(function() {
				request_timer = null
				request.abort();
				base.errorLog('error' , 'api' ,remoteUri , 'Request Timeout' )
				return evt ? evt(false) : {};
            }, config.api.timeout);
			notify && notify.on('abort' , function(){
				if (!request_timer) return
				clearTimeout(request_timer)
				request.abort()
				base.errorLog('error' , 'api' ,remoteUri , 'User Abort' )
				})


            request.write(data);
            request.end();
    
            }

   } 
}

exports.__create = create; 
