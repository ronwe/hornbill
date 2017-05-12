var combo = require('./combo.js')
var extend = require('util')._extend
/*
 * 获得组件及依赖列表 组件内容md5值
 * **/
var GlobalCache
if (!config.etc.watchingTpl) GlobalCache = {}
exports.compile = function(opt , cbk){
	var _Cache = GlobalCache || {}
    if (!opt || !opt.mods ) return cbk('compile nothing')
    var mods = opt.mods.slice(0 , opt.mods.lastIndexOf('.')).split('+') 

	var result = {}
		,result_keys = []
	var opt_mut = extend({} , opt || {} )
	opt_mut.loadDepency = true 

	opt_mut.traverser = function(data ,mod ,depencies,err){
		var key = opt_mut.app + mod

		_Cache[key] = {'md5' : err ? '' : base.md5(data),'depencies':depencies}
		fillInResult(mod , _Cache[key])
	}

	var toTrave = []
	function fillInResult(mod , mod_info){
		if (!mod || !mod_info ||  result[mod]) return
		result[mod] = mod_info.md5 
		result_keys.push(mod)
		mod_info.depencies.forEach( m => {
			var key = opt_mut.app + m
			fillInResult(m , _Cache[key])
		})
	}

	mods.forEach( m => {
		var key = opt_mut.app + m
		if (_Cache[key]){
			fillInResult( m ,_Cache[key])
		}else{
			toTrave.push(m)
		}
	})
	opt_mut.mods = toTrave.join('+') + '.js'
	combo.compile(opt_mut, (err , body) =>{
		//优化js加载应反转树 无依赖的在前面
		var result_reverse = [] 
		for (var i=result_keys.length- 1; i >= 0 ;i--){
			var key = result_keys[i]
			result_reverse.push(`"${key}":"${result[key]}"`)
		}
		body = '{' + result_reverse.join(',') + '}'  //JSON.stringify(result_reverse)
		cbk(err ,body)
	})
}
