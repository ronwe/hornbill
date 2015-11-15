var http = require('http');
var querystring = require('querystring'),
	keepAliveAgent = require(config.path.lib + 'agent.js'),
	cookie = require(config.path.base + 'cookie.js')

var hosts = config.api.hosts || {}, 
	port = config.api.port || 80, 
	debug = config.api.debug;

var agent = config.etc.maxSockets ? new keepAliveAgent({ maxSockets: config.etc.maxSockets }) : false

function create(req ,res , notify) {

    return function(remoteUri , method, reqAct , rawData){
        var reqHeaders = reqAct ? {'request' : reqAct} : {};
        if (!method ) { method = 'GET';}
		var hostSource = 'web'

		if (remoteUri.indexOf('::') > 0){
			remoteUri = remoteUri.split('::')
			hostSource = remoteUri[0]
			remoteUri = remoteUri[1]
			}
		var host = hosts[hostSource]	
		if (!host){
			var splitor = "\n--->\n"
			var errLogTxt = splitor + new Date()
                + splitor + 'url:'+ req.url
                + splitor + 'Data Source: ' + hostSource +  ' is not configed' + "\n<---\n"
			base.errorLog('Data Source: ' + hostSource +  ' is not configed')			
			base.dataErrLog(errLogTxt)			
			host = config.api.host	
			}
		var _origin_remoteUri = remoteUri

        return function(evt , data ) {
			if (!host)   return evt ? evt(false) : {};
			var remoteUri = _origin_remoteUri

            if ('undefined' == typeof data && 'function' != typeof evt){
                data = evt;
                evt = null;
                }
        
            var data = querystring.stringify(data);
			var proxyHeaders = reqHeaders;
            var proxyDomain = ['snakeproxy' ,'mls-time','XREF', 'seashell' , 'clientIp' , 'referer' , 'cookie' , 'user-agent' ];
            proxyHeaders.reqHost = req.headers.host
			proxyHeaders.requrl = req.url
			proxyHeaders.targetEnd = hostSource
            for(var i=0,j = proxyDomain.length ; i < j ;i++ ){
                if (req.headers.hasOwnProperty(proxyDomain[i]) ) {
                    proxyHeaders[proxyDomain[i]] = req.headers[proxyDomain[i]]
                    }
                }
           
            if ('GET' == method){
                if (data) {
					remoteUri = remoteUri.trim()
					if ('&$' ==  remoteUri.slice(-2)) remoteUri = remoteUri.slice(0,-2) 
					else	remoteUri += (remoteUri.indexOf('?')>0 ? '&' : '?') + data
					
					}
                data = ''
              }else{
                proxyHeaders['Content-Type'] =  'application/x-www-form-urlencoded'
                    }
            proxyHeaders['Content-Length'] =  Buffer.byteLength(data,'utf8') //data.length
                    
            var options = {
                 host : host,
                 port : port ,
                 headers: proxyHeaders,
                 path : remoteUri,
                 agent : agent,
                 method : method ,
            };
            var request_timer;
            var st1 = new Date;
            var request = http.request(options , function(response) {
                 request_timer && clearTimeout(request_timer);
				 request_timer = null
                 //console.log('STATUS: ' + response.statusCode);
                 //response.setEncoding('utf8');
				
				 var res_state = response.statusCode;
                 if  (200 != res_state && 400 != res_state && 4000 > res_state) { 
					base.errorLog('error' , 'api' ,remoteUri , 'STATUS: ' , res_state )
					return evt(false); 
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
                     if (runlong > 500) 
						 base.errorLog('warning' , 'api' ,remoteUri , '>500: ' , runlong )
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
							 }else
								 res.setHeader( proxyKey , pdVal)
							
                            }
                         }
                     return evt ? evt(result , res_state) : result;
                             });
                });
            request.on('error' , function(e){
				base.errorLog('error' , 'api' ,remoteUri , e.message )
                evt && evt(false);
                
                });
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
