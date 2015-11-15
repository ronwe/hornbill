exports.html_encode = function(str){
	str = str || "";
	/*s = s || "";
	return s.replace(/"'<>/g , function(s){
		switch(s) {
			case '"': return '&quot;';
			case "'": return '&#39;';
			case "<": return "&lt;";
			case ">": return "&gt;";
			default: return s;
		}
	});*/
	return str.toString().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
	//return str.replace(/&/, '&amp;').replace(/</g, '&lt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;'); 	
}

exports.url_encode = function(str){
	return encodeURIComponent(str);
	}

exports.cloneObj = function(obj){
	var ret = {};
	for(var keys = Object.keys(obj), l = keys.length; l; --l)
		ret[ keys[l-1] ] = obj[ keys[l-1] ];

	return ret;
	
	}

exports.mSubstr = function(str , len , pad){
	if (!str || 0 == str.length) return '';
	if (undefined == pad ) pad = '...';
	len = getStringLengthArr(str , len);
	return str.substr( 0 , len) + ((pad && str.length> len) ? pad : '');
}

exports.nl2br = function(html){
	if(typeof html != 'string') {
		console.log(html , 'not a string');
		return  '';
	}
	return html.replace(/\n/g , '<br />');
}
function getStringLengthArr(s , len){
	var w = 0;
	var time = 0;
	for(length=s.length; time<length; ){
		if(/[^\x00-\xff]/.test(s[time])){
			w+=2;
		}else{
			w+=1;
		}	
		time ++;
		if(w >= (len*2)){
			break;	
		}
	}
	return time;
}
function getStringLength(s){
	return s.replace(/[^\x00-\xff]/g,"**").length / 2;
}
exports.getLink  =  function(obj , query){
	obj = obj || {};
	query = query || {};
	var url = [];
	delete query['frm'];
	for (var k in query){
		if(k in obj) continue;
		url.push( k + '=' + encodeURIComponent(query[k]));
		}

	for(var x in obj){
		if(obj[x] === null) continue;
		url.push( x + '=' + encodeURIComponent(obj[x]) );
		}	

	return '?' + url.join('&');
	}

	
exports.getAppLink = function(protocol,param , os , r ,wapHref ,extra){
	if (!protocol || !param) return false
	if (!os.mlsApp) return wapHref || '###noapp'
	if (r) param.r = r
	var link = 'meilishuo'
	if (os && os.ipad) link = 'meilishuohd'
	link += '://'+ protocol +'.meilishuo?json_params='+ encodeURIComponent(JSON.stringify(param))
	if(extra) link += '&source=' + extra

	return link	
	}
