var fs = require('fs')
    ,path = require('path')
var id = 0
function genGuid(){
	if (id > 1e5) id = 0
	return (+new Date).toString(36) + '-' + (id++)  + '-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	})
}


function etic(tpl){
	var sn = '_ret_'  
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
	return con

}

exports.insertTpl4JS = function(tpl_root , tpl_name ,  jsid, trans_mark ){
	var tpl_path = path.resolve(tpl_root,tpl_name)
	var tpl_body
	if (undefined === trans_mark) trans_mark = 1 
	try{
		tpl_body = fs.readFileSync(tpl_path).toString() 
	}catch(err){
		tpl_body = `/*tpl ${tpl_name} not found*/`	
		trans_mark = false
	}
	if (trans_mark && tpl_body){
		tpl_body = tpl_body.replace(/<\%/g,'<?').replace(/\%>/g,'?>')
	}
	if (2 == trans_mark){
		tpl_body = etic(tpl_body)
		return `<script type="text/template-x" id="${jsid}">${tpl_body}</script>`
		
	}	

	return `<script type="text/template" id="${jsid}">${tpl_body}</script>`
}
exports.htmlEncode = function(str){
	if (typeof str != 'string'){
		str = str + ""	
	}
	return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;')
}

exports.urlEncode = function(str){
	return encodeURIComponent(str)
}

/*
 * 需要调用远程的url 需要先返回占位
* opt 
* url
*/
exports.remoteInclude = function(opt){
	opt = opt || {}
	var guid = genGuid()
	var placeholder = '<%' + guid + '%><%/' + guid + '%>'
	this._remote_to_include = this._remote_to_include || {}
	this._remote_to_include[placeholder] = opt 
	return placeholder
}
exports.nl2br = function(html){
	if(typeof html != 'string') {
		return  ''
	}
	return html.replace(/\n/g , '<br />')
}
function getStringLengthArr(s , len){
	var w = 0
	var time = 0
	for(length=s.length; time<length; ){
		if(/[^\x00-\xff]/.test(s[time])){
			w+=2
		}else{
			w+=1
		}	
		time ++
		if(w >= (len*2)){
			break	
		}
	}
	return time
}
function getStringLength(s){
	return s.replace(/[^\x00-\xff]/g,"**").length / 2;
}
