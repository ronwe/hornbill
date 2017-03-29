var hornbill = require('../frame')
	,path = require('path')

hornbill.start({
	'appsPath' : path.resolve(__dirname , '../apps') 
	,'configPath' : path.resolve(__dirname,'config')
})

function x( req, res, next ,val) {

    // Do Something to `req' or `res'
	//	return res.end('ddd')

    return next(null , val)

}
/*
* urlRegTest url正则测试
* host 域
* after app处理后 
*/
//hornbill.use(x , {urlRegTest:'/' , after: true})
