var events =  require("events");
var mEmitter = new events.EventEmitter;                                                                                              
var eventNum = 0; 
mEmitter.setMaxListeners(0);

function listener(name , data){
    this.eventname = name;                                                                                                 
    this.eventStack = []  ;
    this.eventData = data||{};                                                                                                                 

    this.eventCount = 0; 
    this.eventOnFinish = null;                                                                                                           
    this.__beforeData = null;
    
    }


listener.prototype = {
	listenOn : listenOn ,
	listenOver : listenOver ,
    listenOnSync : listenOnSync
}

function callStack(mSelf , stackTag) {
    if (!mSelf.eventStack.length) {return ;}
    var pop = mSelf.eventStack.shift();
    mSelf.listenOn( pop[0] , function(preData){
        mSelf.__beforeData = preData; 
        callStack(mSelf);
        return stackTag;
        } , pop[1] );
    }

function listenOnSync ( toCallMethod , stackTag , toCallParam){
   this.eventStack.push( [toCallMethod , toCallParam] ); 
   callStack(this , stackTag);

    }

function listenOn ( toCallMethod , assignTag , toCallParam){
	if (!toCallMethod || 'function' != typeof toCallMethod ) {return ;} 


    var eventId = this.eventname + (eventNum++ ); 
    //this.eventOnFish = null;
    var mSelf = this ;
    mSelf.eventCount++ ;
    var evtPass = function(data){
        //var data = Array.prototype.slice.call(arguments , 0 );
        mEmitter.emit(eventId ,  data); 
        
        return data; 
        } 

    if ('function' ==  typeof assignTag){
        evtPass.__preData = this.__beforeData; 
        }

    mEmitter.once(eventId , function(data){
        //console.log(mSelf.eventData);
        if (assignTag) {
                if ('function' ==  typeof assignTag){
                    assignTag = assignTag(data);
                }
                mSelf.eventData[assignTag] = data;
            }else{
                mSelf.eventData = base.array_merge(mSelf.eventData,data);
            }
        if (--mSelf.eventCount <=0 && mSelf.eventOnFinish  ) {
            mSelf.listenOver(  mSelf.eventOnFinish);
            }
    
        });

    toCallParam.unshift(evtPass);
	// toCallMethod.apply(toCallObj , toCallParam);
	 toCallMethod.apply(null , toCallParam);
}


function listenOver (callBack){
    if (!callBack){
        return;
        }
    if (this.eventCount <= 0) {
        //console.log('==========');
        callBack(this.eventData);
        this.eventOnFinish  = null;
        this.eventData  = null;
      }else {
        this.eventOnFinish  = callBack;
      }

}
exports.__create = function (name ,initData){
    return new listener(name,initData);
}



