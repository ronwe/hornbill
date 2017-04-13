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
var plugins = fs.readdirSync(path.resolve(__dirname,'plugin'))
var _plug = {}
plugins.forEach(function(plug){
    var ext = path.extname(plug)
    if ('.js' != ext && '.json' != ext) return
    var plugfn = require(path.resolve(__dirname,'plugin',plug))
    
    _plug[plug.replace(ext,'')] = plugfn 
})
exports.plugin = _plug

exports.insertTpl4JS = function(tpl_root , tpl_name ,  jsid, trans_mark ){
	var tpl_path = path.resolve(tpl_root,tpl_name)
	var tpl_body
	if (false !== trans_mark) trans_mark = true
	try{
		tpl_body = fs.readFileSync(tpl_path).toString() 
	}catch(err){
		tpl_body = `/*tpl ${tpl_name} not found*/`	
		trans_mark = false
	}
	if (trans_mark && tpl_body){
		tpl_body = tpl_body.replace(/<\%/g,'<?').replace(/\%>/g,'?>')
	}

	return `<script type="text/templage" id="${jsid}">${tpl_body}</script>`
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
