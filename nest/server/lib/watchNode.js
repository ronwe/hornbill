var fs = require('fs') ,
    path = require("path");
    

function listenToChange (file ){
    file = path.resolve(file)
    function onChg(prev,now) {
        if (prev.mtime == now.mtime  ) return
        delete require.cache[file] 
    } 

    fs.watchFile(file ,{ persistent: true, interval: 500 } , onChg)
}

function mapDir (dir ,ext) {
    fs.readdir (dir , function(err , files){
        if (err) return
        if (ext && !files.indexOf(ext) ) return
        files.forEach(function(file){
            file = path.resolve(dir ,  file)
            fs.lstat ( file , function (err, stats) {
                if (err) return
                if (stats.isDirectory() ) {
                    mapDir(file , ext)
                    look4New(file)
                }else if (stats.isFile() ){
                    listenToChange(file)

                }

            })
        })

    }) 
}   

 /*
 'somedir' | ['somedir' , 'another dir']
 */  
exports.takeCare = function( dir , ext ){
    if ('string' == typeof dir) dir = [dir]

    dir.forEach(function(dirItem){
        mapDir (dirItem , ext)
    })
}


function look4New(dir  ){
    fs.watch(dir,{ persistent: true, interval: 1000 } , function(eventType, filename){
        filename = path.resolve( dir , filename)
         
        fs.lstat( filename,(err , stats) => {
            if (err) return
            if (stats.isDirectory() ) {
                look4New(filename)
            }else{
                listenToChange(filename)
            }
        })
    })
}
exports.look4New = look4New
