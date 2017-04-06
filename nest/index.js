var hornbill = require('../frame')
	,path = require('path')


function x( req, res, next ,val) {

    // Do Something to `req' or `res'
	return res.end('middleware hijacked')

    return next(null , val)

}
/*
* urlRegTest url正则测试
* host 域
* after app处理后 
*/
hornbill.use(x , {urlRegTest:/^\/$/g,host:'demo' , after: false})
hornbill.cluster({
	'appsPath' : path.resolve(__dirname , '../apps') 
	,'configPath' : path.resolve(__dirname,'config')
	,'staticCompilerPath' : path.resolve(__dirname,'compiler')
},4)
