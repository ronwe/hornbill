var CompilerBase = require(config.path.staticBaseCompiler)
var extend = require('util')._extend
exports.compile = function(opt , cbk){
	if (!CompilerBase.combo) return cbk('compiler doesnt exists')
	var opt_mut = extend({} , opt || {} )

	CompilerBase.cjsList.compile(opt_mut, cbk)
}
