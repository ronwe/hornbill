var fs = require('fs') 
	,path = require('path')
var md5 = require('crypto');
var _cacheArr = {};
var _watched = {};
var compiledFolder = '',
	watchingTpl = true;
var htmlend = '\\n',
	fuss = false;
var dataName = '_data'

var extFnPath = __dirname + '/extFn.js';

function watchTpl(tplname , compiledFile) {
  //var dir = path.dirname(tplname);
  //if (_watched[dir] ) {return;}
	if(_watched[tplname]) {
		return;
	}

	fs.watchFile(tplname, {
		persistent: true,
		interval: 300
	}, onChg);

	function onChg(event, filename) {
		//var tplname = dir + '/' + filename;
		compiledFile = path.resolve(compiledFile)
		delete require.cache[compiledFile]
		_cacheArr[tplname] && delete _cacheArr[tplname];
	}

	_watched[tplname] = true;
}

function getCompiledName(tplname, tplPre) {
	  return compiledFolder + (tplPre || '') + md5.createHash('md5').update(tplname).digest("hex") + '.est';
}


function getErrorDetail(err , cbk){
	if (!err) return
	var stack = err.stack.split('\n')  
	var errDetail = stack[1].match(/getHtml \(([^\:]+)\:(\d+)\:(\d+)\)/) 
	if (!errDetail)
		errDetail = stack[1].match(/getHtml \[as html\] \(([^\:]+)\:(\d+)\:(\d+)\)/)
	if (!errDetail)
		errDetail = stack[1].match(/at (.*\.est):(\d+):(\d+)/)
	//console.log(stack)

	if (errDetail && fs.existsSync(errDetail[1]) ){
		var remaining = ''
			,lineNo = 0 
			,geted = false
		var rs = fs.createReadStream(errDetail[1] );	
		function cbDetail(errorSeg){
			var msg = errorSeg.slice(0,errDetail[3]) + '<<<' + errorSeg.slice(errDetail[3]) +'\n'
			msg += stack[1] + '\n'
			msg += stack[0] 
			cbk(msg)

		}
		rs.on('data' , function(data){
			remaining += data;
			var index = remaining.indexOf('\n');
			var last  = 0;
			while (index > -1) {
				var line = remaining.substring(last, index);
				last = index + 1;
				lineNo++
				index = remaining.indexOf('\n', last);

				if (lineNo == errDetail[2]) {
					geted = true
					cbDetail(line)
					break
				}
			}

			remaining = remaining.substring(last);
			
		})
		rs.on('end', function(){
			if(!geted)  cbDetail(remaining)
		})


	}else{
		console.log(stack)
		cbk (stack[0])	
	}
}

function renderFile(tplpath, tplname, data, callBack, tplPre, requireFn) {

	tplname = tplpath + tplname
	var compiledFile = getCompiledName(tplname, tplPre)
	//var compiledFile = tplname + '.est';
	if(watchingTpl) watchTpl(tplname , compiledFile)

	var _clearCache = function(file) {
		var _getHtml = require(file).html
		if (typeof _getHtml !== 'function') {
			delete require.cache[file]
			_getHtml = require(file).html
		}
		return _getHtml
	}

	function fillTpl() {
		if(true === requireFn) {
			return function(_data){ 
				return _clearCache(compiledFile).call(_data)
			}
		}
		var html = false

		try{
			html = _clearCache(compiledFile).call(data)
		}catch(err){
			var splitLn = "\n------\n"
			data._Request_raw = data._Request_raw || {}
			process.nextTick(function(){
				getErrorDetail(err , function(errorMsg){
					var msg = "\n------>\n" + new Date() 
					+  splitLn + 'url:' + data._Request_raw.url 
					+ splitLn + 'msg:' +errorMsg 
					+ splitLn + 'tpl:' + tplname
					if ('INCFAIL' != err.code) {
					}
					msg += "\n<------\n"
					base.dataErrLog(msg)
				})
			})
		}
		_cacheArr[tplname] = true
		if(callBack) {
			callBack(null, html)
		} else {
			if (false === html) throw base.exception("INCFAIL",tplname)
			return html
		}
	}

	if(fs.existsSync(compiledFile)) {
		///console.log(tplname , _cacheArr[tplname]);
		if(_cacheArr[tplname]) {
			return fillTpl();
		} else {
			var tplMtime = fs.statSync(tplname).mtime;
			var compileMtime = fs.statSync(compiledFile).mtime;
			//console.log('tplMtime' + tplMtime);
			return tplMtime < compileMtime ? fillTpl() : compile(tplpath, tplname, compiledFile, tplPre, fillTpl);
		}
	} else {
		return compile(tplpath, tplname, compiledFile, tplPre, fillTpl);

	}
}

function compile(tplpath, tplname, compiledFile, tplPre, callBack) {
  console.log('----------compile--', tplname);

  function trsTpl(err, data) {

    if(!data) return;
    //// function html_encode(str){return str.replace(/&/, '&amp;').replace(/</g, '&lt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;'); } ;\n \
    var comFileCon = "/*--" + tplname + "--*/ \n \
    var est = require(config.path.lib + 'est/est.js'); \n \
    var _extFn = require('" + extFnPath + "'); \n \
    function requireFn(tpl) { return est.renderFile('" + tplpath + "' ,tpl , null , null ,'" + tplPre + "' ,true); } ; \n \
    function __getHtml () { \n \
		var __StaticModel = this.__StaticModel = this.__StaticModel || {}; \n \
		function StaticModel(type, model){ \n \
			if (!type) return \n \
			var static = __StaticModel[type];if(!static) static = __StaticModel[type] = []; \n\
			if (model) { \n \
				if (static.indexOf(model) === -1) static.push(model) \n \
			} else {return static} }; \n \
		function OutputWrite(str){__htm += str.toString()}; \n \
      var __htm ='';\n";
    var funcCon;
    var pos = 0,
		posStart = 0,
		posEnd = 0;
    var bufferLen = data.length;

    var comments_mark = 0
    function fillCmpl(str , plainGram){
        if (comments_mark > 0 ) return
        if (plainGram ) comFileCon += str
        else comFileCon += "__htm += '" + stripBlank(str) + "';\n"
    }

    while(true) {
		pos = findTag(data, pos, 60, 37)
		if(pos > -1) {
			posEnd = findTag(data, pos + 2, 37, 62)
		} else {
			fillCmpl(buffer2String(data, posStart, bufferLen)) 
			break
		}
		if((pos > -1) && posEnd) {
			fillCmpl(buffer2String(data, posStart, pos)) 
			funcCon = data.toString('utf8', pos + 2, posEnd)
						.replace(/\$_ENGINE_SELF\./g, 'est.')

			switch(funcCon[0]) {
				case '*':
					switch (funcCon[1]){
                        case '{':
                            comments_mark++
                            break
                        case '}':
                            comments_mark--
							if (comments_mark < 0 ) comments_mark = 0
                            break
                        }	
					break
				case '=':
					switch(funcCon[1]) {
						case '=':
							fillCmpl( '__htm +=' + stripBlank(funcCon.substr(2)) + ";\n" , true)
							break
						default:
							var _fn_name = '_extFn.html_encode',
								_func_stripted = stripBlank(funcCon.substr(1))

							fillCmpl( '__htm += ' + _fn_name + '(' + _func_stripted + ");\n" , true)
							break
					}
					break
				case '#':
					fillCmpl( '__htm += requireFn("' + funcCon.substr(1).trim() + '" )(this)||"";\n' , true)
					break
				default:
					fillCmpl( funcCon + ';' , true)
			}

		}
		pos = posStart = posEnd + 2
		posEnd = 0
    }

    comFileCon += "return __htm;} \n exports.html = __getHtml; "
    ///console.log(comFileCon);

	function onWriteDone(e) {
		if(e) {} else {

			delete require.cache[compiledFile];
			_cacheArr[tplname] = true; //compiledFile;
			return callBack();
		}
	};
    console.log(compiledFile);
    fs.writeFileSync(compiledFile, comFileCon);
    return onWriteDone();
  };
  return trsTpl(null, fs.readFileSync(tplname));
}

function stripBlank(str) {
	if(fuss) {
		str = str.replace(/[  ]+/g, ' ');
	}
	return str;
}


function buffer2String(buffer, start, end) {
	return buffer.toString('utf8', start, end).replace(/<script[^>]*>[\s\S\r\n]*<\/script>/m, function(scriptStr) {
		scriptStr = scriptStr.split("\n");
		if(scriptStr[0].indexOf('type="text/html"') < 0) {
			var i = 0,
			j = scriptStr.length;
			for(; i < j; i++) {
				if('//' == scriptStr[i].trim().substr(0, 2)) scriptStr[i] = '';
			}
		}
		return scriptStr.join('\n');
	}).replace(/\\/g, '\\\\').replace(/[\n\r]+/g, htmlend).replace(/'/g, "\\'");
}

function findTag(buffer, start, char1, char2) {
	for(var i = start, j = buffer.length; i < j; i++) {
		if(buffer[i] == char1 && buffer[i + 1] == char2) {
			return i
		}
	}
	return -1
}
var assigned = {}
exports.assignFn = function(fname, fncxt) {
	assigned[fname] = fncxt;
}
exports.callFn = function(fname) {
	return assigned[fname];
}

exports.renderFile = renderFile;
exports.setOption = function(options) {
	compiledFolder = options.compiledFolder || '';
	if(options.hasOwnProperty('watchingTpl')) watchingTpl = options.watchingTpl;
	if(options.hasOwnProperty('fuss')) {
		fuss = options.fuss;
		htmlend = options.fuss ? '' : htmlend;
	}
}
