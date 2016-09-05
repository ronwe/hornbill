var cluster = require('cluster')
	,fs = require("fs");

var conf = require('./config/etc.json')
var numCPUs = conf.cpuNums || require('os').cpus().length

cluster.setupMaster({
    exec : './server.js',
    args : [],
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





