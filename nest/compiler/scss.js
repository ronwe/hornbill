var path = require('path')
try	{
	var sass = require('node-sass')
}catch(err){}

/*
 * https://github.com/sass/node-sass
 * */
var lib_sass_path = path.join(__dirname ,'../stylesheets')

function loadMod(modPath , modName , cbk){

    var mod_full_path = modPath + '/scss/' + modName + '.scss'
	sass.render({
		file: mod_full_path,
		indentedSyntax: true,
		includePaths: [ lib_sass_path],
		outputStyle: 'compressed'
	}, function(err, result) { 
		if (err) return cbk(err)
		cbk(null , result.css.toString())
	})

}
exports.compile = function(opt , cbk){
	if (!sass) return cbk('sass doesnt installed')
    if (!opt || !opt.mods ) return cbk('compile nothing')
    var mods = opt.mods.slice(0 , opt.mods.lastIndexOf('.')).split('+')
        ,modPath = opt.modPath

	var mods_len = mods.length 
	
	var result = {} 
	function onDone(mod ,err , context) {
		mods_len--
		result[mod] = {err : err , context : context}
		if (mods_len >  0) return

		var body  = ''
		mods.forEach(function (m){
			var enum_ret = result[m]
			if (enum_ret.err) {
				body += '/*' + m + ' compile error ['  + enum_ret.err +'] */'
			}else{
				body += enum_ret.context
			}
		})
		cbk(null , body)

	}

	mods.forEach(function(m){
		loadMod(modPath , m , onDone.bind(null, m))
	})
}
