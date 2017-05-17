var hornbill = require('../frame')
	,path = require('path')

/*
function x( req, res, next ,val) {
    // Do Something to `req' or `res'
	return res.end('middleware hijacked')
    return next(null , val)

}
function jsRewrite(req, res, next ,val){
	if (req.url.indexOf('/jslib/bootpack.js') === 0){
    	return next(null , {'rewrite' : 'http://' + req.headers.host + '/jslib/boot,/jslib/lz-string.min,/jslib/zepto.min.js' })
	}else{
    	return next(null , val)
	}
}
*/
var cacheWorker = require('./middleware/cache.js')
	,gzip = require('./middleware/compress.js')
/*
* urlRegTest url正则测试
* host 域
* after app处理后 
*/
if (process.env.NODE_ENV == 'production'){
	hornbill.use(gzip(), {host:'demo'  })
	hornbill.use(cacheWorker.work({'expires' : 0}), {urlRegTest:/\.(js|css)(\?.*)?$/g,host:'demo'  })
}

//hornbill.use(x , {urlRegTest:/\.js$/g,host:'fx' , after: true})
/*
hornbill.cluster({
	'appsPath' : path.resolve(__dirname , '../apps') 
	,'configPath' : path.resolve(__dirname,'config')
	,'staticCompilerPath' : path.resolve(__dirname,'compiler')
},4)
*/
hornbill.start({
	'appsPath' : path.resolve(__dirname , '../apps')
	,'configPath' : path.resolve(__dirname,'config')
	,'staticCompilerPath' : path.resolve(__dirname,'compiler')
	,'etc' : {'loadDepency' : true},
})
