var extend = require('util')._extend
var CompilerBase = require(config.path.staticBaseCompiler)
try{
	var uglifyjs = require("uglify-js")
}catch(err){
}
exports.compile = function(opt , cbk){
	if (!uglifyjs) return cbk('uglifyjs isnt installed')
	if (!CompilerBase.combo) return cbk('compiler doesnt exists')
	opt = opt || {}
	var opt_mut = extend({} , opt )
	if (opt_mut.mods.slice(0,1) === '!'){
		opt_mut.loadDepency = false 
		opt_mut.mods = opt_mut.mods.slice(1)
	}else{	
		opt_mut.loadDepency = true
	}

	function miniFy(str){		
		var minied_code = uglifyjs.minify(str , {fromString : true})
		return minied_code && minied_code.code
	}
	opt_mut.traverser = function(data){
		return miniFy(data)	
	}
	CompilerBase.combo.compile(opt_mut, cbk)
	
	
	/*
	//compress after all chunk shipped 
	
	CompilerBase.combo.compile(opt_mut, function(err,data){
		if (err) return cbk(err)
		var minied_code = miniFy(data)

		cbk(null , minied_code)
	})
	*/
}
