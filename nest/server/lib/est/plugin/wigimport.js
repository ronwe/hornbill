var babel = require('babel-core')
function getDepencies(context){
    var deps = []
    context =  context.replace(/(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)/g,'') 
    var reg = /\brequire\(['"]([a-z0-9-_\.]+)['"]\)/mg

    while ( mod = reg.exec(context) ) {
        mod = mod[1]
        if (-1 === deps.indexOf(mod)) deps.push(mod)
    }
    return deps 
}
exports.trans = function(code){
    var ast = babel.transform(code,{ "presets": ["react" ,"es2015"] })
    var deps = getDepencies(ast.code) 

    return {deps : deps , code : ast.code}

}
