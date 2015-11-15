var http = require("http")

var router = require("./router.js")

var numCPUs = config.etc.cpuNums || require('os').cpus().length;

function start(route , port) {
	function onRequest(request, response) {

		route(request ,response)

	}

	http.createServer(onRequest).listen(port || 80)
	console.log("Server has started.")
}

start(router.route , config.etc.onPort || 8888)

if (config.etc.watchingTpl){
    var watcher = require("./lib/watchNode.js");
    var absDir = __dirname.replace(/\\/g,'/');
    watcher.takeCare([config.path.appPath  ] );
    //watcher.takeCare([config.path.appPath , absDir + "/base" ,absDir + "/lib"] );
}
