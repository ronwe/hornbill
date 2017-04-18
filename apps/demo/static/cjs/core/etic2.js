var cache = {}
var sn = '_ret_'  
function etic(tplId , data){
    if (!tplId) return
    var tplNode  = document.getElementById(tplId)
    if (!tplNode) return

    function  cbk(){
        return data ? cache[tplId](data) : cache[tplId]
    }

    if (cache[tplId]) return cbk()

    var tpl = tplNode.innerHTML

	if ('text/template-x' == tplNode.getAttribute('type')) {
		var con = tpl	
	}else {
		var con = 'var ' + sn + ' ="" ;'
		function tLine(str ){
			return str.replace(/[\r\t\n]/g, " ").replace(/'/g , "\\'")
		}

		while (true){
			var sPos = tpl.indexOf('<?')
			if (-1 == sPos) break
			var ePos = tpl.indexOf('?>' , sPos + 2)

			var part1 = tpl.slice(0,sPos)
				, f = tpl.slice(sPos + 2 , ePos)
				,tpl = tpl.slice(ePos + 2)
			var op = f.charAt(0)
			if (part1.length) con += sn + " += '" + tLine(part1) + "';"
			switch (op){
				case '=' :
					f = f.slice(1)
					con += sn + " += " + f + ";"
					break
				case '#' :
					f = f.slice(1).trim()
					con += sn +  " += etic2('" + f + "')(this);"
					break
				default:
					con += f
			}

		}

		tpl.length  && (con += sn + " += '" + tLine(tpl) + "';")
		con += 'return ' + sn
	}
    try{
        var t = new Function("" , con)
        cache[tplId] = function (data){ return t.call(data)}
        return cbk()
    }catch(e){
        console && console.log(e , tpl)
    }

}

window.etic2 = etic
module.exports = etic 
 
