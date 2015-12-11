var util = require('util')
	,cryto = require('crypto')
	,fs = require('fs')

//status|X-Real-IP|uri|cookie|request time|error message(error log)
var accessLogId = (config.etc.debug && config.etc.debug.length > 5 )? config.etc.debug + 'access-' +date('ymd') + '.log' : false
	,errorLogId = (config.etc.debug && config.etc.debug.length > 5 )? config.etc.debug + 'error-' +date('ymd') + '.log' : false
	,dataErrLogId = (config.etc.debug && config.etc.debug.length > 5 )? config.etc.debug + 'renderError-' +date('ymd') + '.log' : false
	

exports.accessLog = function (status , req , msg){
	var headers = req.headers
		,logTxt = [status , headers['clientIp'] || headers['x-forwarded-for'] || headers['x-real-ip'] ,
					req.url , headers.seashell , req.__request_time , msg || ''].join(' | ')
	mkLog(accessLogId, logTxt)
}
exports.errorLog = function (){
	var logTxt = new Date + ' | ' + Array.prototype.join.call(arguments , ' | ')
	mkLog(errorLogId , logTxt)
}
exports.dataErrLog = function(logTxt){
	mkLog(dataErrLogId , logTxt)
	
}
function mkLog(file , logTxt){
	if (file)
		fs.appendFile(file , logTxt + "\n", function(){}) 
	else
		console.log(logTxt)
}


function format(str , params){
	params.unshift(str);
	return util.format.apply(null , params);
}
function cloneObj(obj){
	var ret = {};
	for(var keys = Object.keys(obj), l = keys.length; l; --l)
		 ret[ keys[l-1] ] = obj[ keys[l-1] ];

	return ret;
}
function isUnDefined (varObj){
	return ('undefined' == typeof varObj);
}



exports.md5 = function md5(str) {
    return str ? cryto.createHash('md5').update(str.toString()).digest("hex") : '';
}
/*
*继承并创建新对象*/
exports.inherit = function (clsContruct , supClsObj,  override){
    
    //override = !!override;
	if ('function' == typeof supClsObj) {
        	supClsObj = new supClsObj;
	}
    clsObj = new clsContruct;


     for (var attr in supClsObj){
         if (override || !clsObj[attr]){
               if( supClsObj.hasOwnProperty(attr) ) {
                     clsObj[attr] = supClsObj[attr];
                 }else{
                     clsContruct.prototype[attr] = supClsObj[attr];
                  }
            };
       }
	return clsObj;
}
//加载base类库
exports.loadBase = function(modName){
    return require(config.path.base + modName)
}
