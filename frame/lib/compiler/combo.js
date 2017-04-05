var fs = require('fs')
    ,path = require('path')
var _depencies_cache = {}
const STATUS = {
    'LOADING' : 1
    ,'LOADED' : 2
}


const LoadDepency = config.etc.loadDepency
function getDepencies(context){
    var deps = []
    ///context =  context.replace(/(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)/g,'')
    while(true){
        var comment_start = context.indexOf('/*' )
        if (-1 === comment_start ) break
        var comment_end =  context.indexOf('*/' , comment_start)
        if (-1 === comment_end) break
        context = context.slice(0,comment_start) + context.slice( comment_end + 2 )
    }

    context =  context.replace(/\/\/[^\n]*\n/g,'')
    var reg = /\brequire\(['"]([a-zA-Z0-9\-_\.\/]+)['"]\)/mg

    while ( mod = reg.exec(context) ) {
        mod = mod[1].replace(/\.js$/i,'')
        if (deps.indexOf(mod) === -1) deps.push(mod)
    }

    return deps
}

function putInLoadStack(stack , mod){
    if (stack.indexOf(mod) === -1) stack.push(mod)
}

function rmFrmLoadStack(stack , mod){
    var i = stack.indexOf(mod)
    if (i !== -1) stack.splice(i,1)
}

function loadMod(modPath , modName ,load_stack , _mods_state , _bool_load_depency ,traverser ,cbk ){
    if (_mods_state[modName]) return
    putInLoadStack(load_stack , modName)
    _mods_state[modName] =  STATUS.LOADING
    var mod_full_path = modPath + '/cjs/' + modName + '.js'
    fs.readFile(mod_full_path, (err , data) => {
        if (err) data = '/*' + err.toString() + '*/'
        data = data.toString()


        var depencies = getDepencies(data)  || []    
        rmFrmLoadStack(load_stack,modName)
        _bool_load_depency && depencies.forEach(dep_mod => loadMod(modPath, dep_mod,load_stack , _mods_state , _bool_load_depency , traverser ,cbk))

        _mods_state[modName] =  STATUS.LOADED

		var script_code = 'booter.define("' + modName + '" , ' + JSON.stringify(depencies)+ ' , function(require ,exports ,module){ \n' + data + ' \n});\n'

		if (traverser) script_code = traverser(script_code)

        cbk(null , script_code)
    }) 
}


/*
 * modPath required
 * mods required
 * loadDepency 是否加载依赖
 * */
exports.compile = function(opt , cbk){
    if (!opt || !opt.mods ) return cbk('compile nothing')
    /*
     * 拆成模块  分析依赖 加载依赖 去重 排序  
    */
    var mods = opt.mods.slice(0 , opt.mods.lastIndexOf('.')).split('+') 
        ,modPath = opt.modPath

    var output = []
        ,load_stack = []
        ,_mods_state = {}
    function assemble(err , context){
        if (err) context = '<!--' + err.toString() + '-->' 
        output.unshift(context) 
        if (0 === load_stack.length) {
            cbk(null ,output.join('\n') )
        }
    }

	var _load_depency = opt.loadDepency || LoadDepency
		,traverser = opt.traverser

    mods.forEach( _m => loadMod(
				modPath 
				, _m.replace(/\.{2,}/g, '')  
				, load_stack 
				, _mods_state 
				, _load_depency
				, traverser
				, assemble ))
}
