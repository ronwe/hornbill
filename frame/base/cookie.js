exports.getHandler = function(req , res){
        var cookies = {}
		if (!('__addCookie' in req))	req.__addCookie = []

        if (! req.__cookies) {
         //read cookie
            req.headers.cookie && req.headers.cookie.split(';').forEach(function( cookie ) {
				var ppos = cookie.indexOf('=')
				var p1 = cookie.slice(0 , ppos)
					,p2  = cookie.slice(ppos + 1)

				cookies[decodeURIComponent(p1.trim())] = decodeURIComponent((p2 || '').trim())
				/*
                var parts = cookie.split('=');
                cookies[ parts[ 0 ].trim() ] = ( parts[ 1 ] || '' ).trim();
				*/
                });
            req.__cookies = cookies
         } else {
            cookies = req.__cookies
         }

		function set(name , val , expires ,set_host){
			if (set_host) set_host = 'domain=' + set_host + ';'
			else set_host = ''

			if (!res) return
			if (arguments.length ==  1){
				var cookie_v = name
			}else{
				var cookie_v = encodeURIComponent(name) + '=' + encodeURIComponent(val) + ';Path=/;'+ (set_host  )
				if (expires)
					cookie_v += 'expires='+ expires.toGMTString()+';'

				cookies[name] = val
			}
			if (req.__addCookie.indexOf(cookie_v) < 0){
				if (req.__addCookie.length < 15) {
					req.__addCookie.push(cookie_v)
				}
				try{
                    res.setHeader('set-cookie' ,req.__addCookie )
				}catch(e){
                    console.log('Cookie unwrite' ,name , e)
				}
		    }
		 }
		 function get(name) {
			return cookies[name]
		 }
		function clear(name){
			return set(name, '')
		}

		 return {set:set , get :get, clear:clear}

    }
