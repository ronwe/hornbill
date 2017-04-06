var cluster = require('cluster')
	,path = require('path')
	,fs = require("fs")

var server = require('./server.js')

/*
* 注册中间件
* connect 中间件
* path 路径
* host 域
* */

exports.use = function(connect , opt){
	opt = opt || {}
	server.connect(connect , {
		'urlRegTest' : opt.urlRegTest,
		'host' : opt.host,
		'after' : opt.after
	})
}


/*
 * appsPath apps路径
 * configPath 配置文件路径
 * staticCompilerPath 静态文件compiler路径 
 */
function startService(options){
	server.start(options)
	/*
	options = options || {}
	var numCPUs = options.cpuNums || require('os').cpus().length

	cluster.setupMaster({
		exec : path.resolve(__dirname,'./server.js'),
		args : [options.configPath  , options.appsPath],
		silent : false
	})

	for(var i = numCPUs ; i--;){
		cluster.fork()
	}

	cluster.on('exit', function(worker) {
		var st = new Date
		st = st.getFullYear()+ '-'+ (st.getMonth()+1)+ '-'+st.getDate()+ ' '+st.toLocaleTimeString()
		console.log('worker ' + worker.process.pid + ' died at:',st);
		cluster.fork()
	 })
	 */
}
process.on('uncaughtException', function (err) {
    console.log(err)
})

exports.start = startService 

exports.cluster = function(options , child_process_count){
	child_process_count  = child_process_count | 0 || require('os').cpus().length
	if (child_process_count <= 0 ) return startService(options) 
	if (cluster.isMaster) {
		for (var i = 0; i<child_process_count ; i++) {
			cluster.fork()
		}
	 
		cluster.on('exit', function(worker, code, signal) {
			console.log('worker ' + worker.process.pid + ' died')
		})
	} else {
		startService(options)
	}

}




