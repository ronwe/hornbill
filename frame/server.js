var argv_options = process.argv.slice(2)

var http = require("http")

var router = require("./router.js")


function start(route , port) {
	function onRequest(request, response) {

		route(request ,response)
	}

	http.createServer(onRequest).listen(port || 80)
	console.log("Server has started.")
}


function tryWatching(){
	if (config.etc.watchingTpl){
		var watcher = require("./lib/watchNode.js")
			,fs = require('fs')
			,path = require('path')
		
		var watches = []
		fs.readdir(config.path.appPath, (err , dir) => {
			if (err) return console.log(err)
			dir.forEach((d) => {
				if ('.' === d.slice(0,1)) return 
				d = path.resolve(config.path.appPath , d)
				;['controller' , 'model' , 'views'].forEach((s) => {
					s = path.resolve(d,s)
					if (fs.existsSync(s)) watches.push(s)
				})
			})
			watcher.takeCare(watches)
		})
		watcher.look4New(config.path.appPath) 
		//watcher.takeCare([config.path.appPath  ] , undefined , ['controller' , 'model' , 'views'])
	}
}
exports.start = function(options){
	options = options || {}
	router.setGlobal(options)
	tryWatching()
	start(router.route , config.etc.onPort || 80)
}

exports.connect = router.connect
