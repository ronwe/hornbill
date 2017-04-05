try	{
	var sass = require('node-sass')
}catch(err){}

/*
 * https://github.com/sass/node-sass
 * */
function loadMod(modPath , modName , cbk){

    var mod_full_path = modPath + '/scss/' + modName + '.scss'
	console.log(mod_full_path)
	sass.render({
		file: mod_full_path,
		//includePaths: [  ],
		outputStyle: 'compressed'
	}, function(err, result) { 
		if (err) return cbk(err)
		cbk(result.css)
	})

}
exports.compile = function(opt , cbk){
	if (!sass) return cbk('sass doesnt installed')
    if (!opt || !opt.mods ) return cbk('compile nothing')
    var mods = opt.mods.slice(0 , opt.mods.lastIndexOf('.'))
        ,modPath = opt.modPath

	loadMod(modPath , mods ,cbk)
}
