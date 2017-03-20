var cluster = require('cluster')
	,path = require('path')
	,fs = require("fs")

/*
 * cpuNums 启动cpu数
 * appsPath apps路径
 * configPath 配置文件路径
 */
exports.start = function(options){
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
}




