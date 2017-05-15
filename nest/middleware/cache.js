var req_cache = {}
/*
* expires 有效期 单位秒 惰性删除 
*/
exports.work = function(opt ){
	opt = opt || {}
	if (opt.expires) opt.expires = opt.expires * 1000
	
	return function (req, res, next ,val){
		var cache_key = req.url
		var cache_context = req_cache[cache_key] 
		if (cache_context && opt.expires && cache_context.time + opt.expires < +new Date){
			delete req_cache[cache_key]
			cache_context = null
		}
		if (cache_context){
			res.writeHead(cache_context.status ,cache_context.headers)
			res.write(cache_context.body)
			res.end()
			cache_context.time = +new Date
			return
		}
		// wrap res.write res.end method
		var _content = ''
		var _cache_wrapper = {
			write: res.write,
			end: res.end
		}
		res.write = function(content) {
			if (content ) _content += content
			return _cache_wrapper.write.apply(this, arguments)
		}
		res.end = function(content) {
			if (content ) _content += content
			return _cache_wrapper.end.apply(this, arguments)
		}
		res.on('finish', function(){
			req_cache[cache_key] = {
				'headers' : res.getHeaders()
				,'body' : _content
				,'status' : res.statusCode
				,'time' : +new Date
			}
		})

		return next(null , val)
	}
}
