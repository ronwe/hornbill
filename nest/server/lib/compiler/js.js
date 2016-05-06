var fs = require('fs')
    ,path = require('path')
var _depencies_cache = {}

function getDepencies(context){
    var reg = /(?:\s*=\s*)?require\(['"]\w+['"]\)/g
    var deps = []
    context =  context 
    var r = context.match(reg)
    console.log(r)
 
    return deps 
}

function putInLoadStack(stack , mod){
    if (stack.indexOf(mod) === -1) stack.push(mod)
}
function rmFrmLoadStack(stack , mod){
    var i = stack.indexOf(mod)
    if (i !== -1) stack.splice(i,1)
}
function loadMod(modPath , modName ,load_stack , cbk ){
    putInLoadStack(load_stack , modName)
    var mod_full_path = modPath + '/js/' + modName + '.js'
    fs.readFile(mod_full_path, (err , data) => {
        if (err) return cbk(err)
        data = data.toString()
        var depencies = getDepencies(data)  || []    
        rmFrmLoadStack(load_stack,modName)
        depencies.forEach(dep_mod => loadMod(modPath, dep_mod,load_stack ,cbk))
        cbk(null , 'define("' + modName + '" , ' + JSON.stringify(depencies)+ ' , function(require ,exports){ \n' + data + ' \n})')
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
    function assemble(err , context){
        if (err) context = '<!--' + err.toString() + '-->' 
        output.unshift(context) 
        if (0 === load_stack.length) {
            cbk(null ,output.join('\n') )
        }
    }

    mods.forEach( _m => loadMod(modPath , _m.replace(/\.{2,}/g, '')  , load_stack , assemble ))
}
