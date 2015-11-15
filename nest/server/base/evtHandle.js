var initData = {};
var initDataKey = [];
function listener( data){
	this.listenStack = [];    
	this.onOver = null
    }


listener.prototype = {
	listenOn : listenOn ,
	listenOver : listenOver ,
}

function listenOn ( toCallMethod , assignTag , toCallParam){
	if (!toCallMethod || 'function' != typeof toCallMethod ) {return ;} 
	this.listenStack.push([toCallMethod , assignTag , toCallParam]);
}

function listenOver (callBack,noPrepare){
    var eventCount = this.listenStack.length; 
	var eventData = {}
		,eventOnOver = this.onOver
	if (noPrepare !== true){
		initDataKey.map (function(key){
			eventData[key] = initData[key];
			});
	}
	function _cbk(){
		try{
			if (eventOnOver && false === eventOnOver(eventData)) return
			callBack(eventData);
		}catch(err){
			callBack(false , err)
			}
		}

	if (eventCount == 0 ) {
		_cbk()
		return;
		}
	this.listenStack.map(function(item){
		var toCallMethod = item[0], 
			assignTag = item[1], 
			toCallParam	= item[2];	

		var evtPass = function(data){
			eventData[assignTag] = data;
			eventCount--;
			//console.log (eventCount, assignTag , eventData);
			if (eventCount <= 0 ) {
				_cbk()
				}
			}
		toCallParam.unshift(evtPass);
		toCallMethod.apply(null , toCallParam);
	});
}
exports.prepareData = function(data){
	initData = data;
	initDataKey = Object.keys(data);
	}
exports.__create = function (){
    return new listener();
}



