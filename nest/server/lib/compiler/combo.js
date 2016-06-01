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
    context =  context.replace(/(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)/g,'') 
    var reg = /\brequire\(['"]([a-z0-9\-_\.\/]+)['"]\)/mg

    while ( mod = reg.exec(context) ) {
        mod = mod[1].replace(/\.js$/i,'')
        deps.push(mod)
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

function loadMod(modPath , modName ,load_stack , _mods_state , _bool_load_depency ,cbk ){
    if (_mods_state[modName]) return
    putInLoadStack(load_stack , modName)
    _mods_state[modName] =  STATUS.LOADING
    var mod_full_path = modPath + '/js/' + modName + '.js'
    fs.readFile(mod_full_path, (err , data) => {
        if (err) data = '/*' + err.toString() + '*/'
        data = data.toString()
        var depencies = getDepencies(data)  || []    
        rmFrmLoadStack(load_stack,modName)

        _bool_load_depency && depencies.forEach(dep_mod => loadMod(modPath, dep_mod,load_stack , _mods_state , _bool_load_depency , cbk))

        _mods_state[modName] =  STATUS.LOADED

        cbk(null , 'booter.define("' + modName + '" , ' + JSON.stringify(depencies)+ ' , function(require ,exports ,module){ \n' + data + ' \n})')
    }) 
}


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

    mods.forEach( _m => loadMod(modPath , _m.replace(/\.{2,}/g, '')  , load_stack , _mods_state , LoadDepency,  assemble ))
}
