;(function(global ,undefined){
    var index = 0
    global.nextTick = function(fn , ttl){
        global.setTimeout(fn , ttl || 0)
    }
    global.uuid = function(pre , len){
        var uid = (+new Date).toString(36) 
        if (len) return uid.slice( -len)
        return (pre || '') + uid + '_' + ++index 
    }
    function _detectType(obj , type){
        return Object.prototype.toString.call(obj) == "[object "+type+"]";
    }

    var util = global.util = {
        uuid : uuid
        ,build_query : function(obj){
                if (_detectType(obj , 'String')) return obj
                var ret = []
                for (var name in obj){
                    ret.push(encodeURIComponent(name) + '=' + encodeURIComponent(obj[name]))
                }
                return ret.join('&')
            }
        ,report : function(){
            console && console.log &&  console.log.apply(console , arguments)
            }
        ,reportErr : function(){
            console && console.error &&  console.error.apply(console , arguments)
            }
        ,nextTick : nextTick
        ,toArray : function(colletions ,offset){
                return Array.prototype.slice.call(colletions , offset || 0) 
                }
        ,isArray : function(obj){
                return _detectType(obj , 'Array')
                }
        ,detectType : function(obj , M){
                return _detectType(obj , M)
                }
    }

    var head = document.head  || document.getElementsByTagName('head')[0] || document.documentElement
    global.loadJS = function(src , opt){
        opt = opt || {}
        var l = document.createElement('script')
        l.type = 'text/javascript'
        l.src =  src
        if (opt.onErr) l.onerror = opt.onErr 
        if (opt.onLoad) l.onload = opt.onLoad 
        head.appendChild(l)
        return l
    }

    global.loadCSS = function(css){
        var l = document.createElement('link')
        l.setAttribute('rel','stylesheet')
        l.setAttribute('href',css)
        head.appendChild(l)
    }

})(this)


;(function(global ,undefined){
    var evts = {}
        ,onceTag = '__event_once'
    function emit(event ){
        var args = util.toArray(arguments , 1)
        if (!(event in evts)) return
        var _dels = []
        for (var i = 0 , j = evts[event].length ; i < j ;i ++){
            var cbk = evts[event][i]
            if (!cbk) return
            cbk.apply(null , args)
            if (cbk[onceTag])  { 
                evts[event][i] = null 
                _dels.push(i)
            } 
        }
        for (var i = _dels.length -1 ; i>=0 ; i--) evts[event].splice(_dels[i] , 1)
    }

    function addMultiCon(event , listener){
        var once = true
        event.sort()
        addListener(event.join('|') , listener , once)
        var eventBubbles = []
            ,ret = {}
        function tinOpener(evt){
            eventBubbles.push(evt)

            if (arguments.length > 2)
                ret[evt] = util.toArray(arguments , 1)
            else
                ret[evt] = arguments[1] 

            if (eventBubbles.length >=  event.length) {
                eventBubbles.sort()
                emit(eventBubbles.join('|') , ret)
            }
        } 

        for (var i = 0 ; i < event.length;i ++){
            addListener(event[i] , tinOpener.bind(null, event[i]) , once)
        }
    }

    function addListener(event , listener , once){
        if (util.isArray(event)) return addMultiCon(event , listener)


        if (!(event in evts)) evts[event] = []
        if (once) listener[onceTag] = true
        evts[event].push(listener)
    }

    function removeListener(event, listener){
        if (!listener) {
            delete evts[event]
            return
        }
        for (var i = evts[event].length -1 ; i >= 0 ;i --){
            if (evts[event][i] === listener) {  evts[event].splice(i, 1) ; break}
        }
    }

    function listeners(event){
        return evts[event]
    }
    global.emitter = {
        on : addListener
        ,once : function(event , listener){
                addListener(event , listener , true)
                } 
        ,emit : emit
        ,removeListener : removeListener
        ,listeners : listeners
    }
})(this)


;(function(global ,undefined){
    var mods = {}
        ,modDefining = {}
        ,inteligent = {}

    function require(mod , callerMod ,ns){
        if (util.detectType(mod , 'Function')) {
            mod = inteligent[mod] 
        }

        if (mod){
            mod = trnName(mod , callerMod)
        }
        if (! isModLoaded(mod ,ns) ) throw mod + '@' + ns + ' lost'
        if (ns) mod += '@' + ns
        return mods[mod]
    }

    function trnName(name , callerMod){
        if (callerMod) {
            var spath = name.split('/')
            if ('.' == spath[0]) spath[0] = callerMod.split('/')[0]
            var apath = []
            spath.forEach(function(path_item){
                if (!path_item || '.' == path_item) return 
                if ('..' == path_item) apath.pop()      
                else apath.push(path_item)
            })  
            //if (1 == apath.length) apath.push('index')
            name = apath.join('/')
        }

        //if (-1 == name.indexOf('/') ) name += '/.index'
        return name
        ///return name.replace(/\//g,'::')
    }
    var DEFINESTAT = {'DEFINING' : 1 ,'ASYNCLOAD' : 2 ,'DEFINED':3}

    function define(modOrign , depencies , con ,opt){
        var mod = trnName(modOrign )
        var modNS = mod 
        var ns = define.ns
        if (ns) modNS += '@' + ns

        if (modNS in mods) return
        modDefining[modNS] = DEFINESTAT.DEFINING 

        opt = opt || {}

        var toLoad = []
        for (var i = 0,j = depencies.length ; i <  j ; i++){
            var toDep = depencies[i]
            //智能加载
            if (util.detectType(toDep , 'Function')) {
                if (!inteligent[toDep] ) inteligent[toDep] = toDep()
                depencies[i] = inteligent[toDep] 
            }
            var dependName = trnName(depencies[i] , mod)
            if (! isModLoaded(dependName , ns)) toLoad.push(dependName)
        }

        if (toLoad.length){
            //跨组件返回的js可能需要的依赖在下面，这里trick下  先执行无依赖的 ，有依赖的延时执行
            if (!opt.defered) {
                //util.report(modOrign + " lack of some  depencies " , toLoad)
                nextTick(function(){
                    opt.defered = true
                    define(modOrign , depencies , con ,opt)         
                })
                return
            }


            if (opt.throwIfDepMiss) return emitter.emit(modNS + ':loadfail'  , {"message" : toLoad.join(',') + ' miss while loading ' + mod})

            //依赖失败的话会尝试异步拉取一次
            //已加载的模块不再拉了
            var _on_evt_list = []
            for (var i = toLoad.length-1 ;i >= 0 ;i --){
                var _m = trnName(toLoad[i])
                if (ns) _m += '@' + ns
                _on_evt_list.push(_m + ':defined')
                if (modDefining[_m]) toLoad.splice(i,1) 
                else modDefining[_m] = DEFINESTAT.ASYNCLOAD 
            }

            emitter.on(_on_evt_list , function(){
                define(modOrign , depencies , con)
            })

            if (toLoad.length) {
                console.log('miss' , toLoad)
            }
            return
        }

        var exports = {}
            ,module = {exports : undefined}

        var ret = con(function(inMod){ return require(inMod , mod ,ns)}, exports , module) 
        mods[modNS] = module.exports 
        if (undefined === module.exports) mods[modNS] =  exports || ret
        modDefining[modNS] = DEFINESTAT.DEFINED 

        emitter.emit(modNS + ':defined')
    }

    function isModLoaded(mod , ns){
        var modNS = trnName(mod) 
        if (ns) modNS += '@' + ns
        return  (modNS in mods)
    }

    global.require = require
    global.define = define
    global.isModLoaded = isModLoaded
    
    function appendFix(obj , stuffix){
        var util = global.util
        if (util.isArray(obj)){
            obj = obj.map(function (item){
                return item + stuffix
            })
        } else if (util.detectType(obj,'String')){
            obj += stuffix
        }
        return obj
    }

    ~function(){
        var async_mod = []
            ,async_timer
            ,async_event = []
        global.asyncLoad = function(mod , cbk){

            function onLoad(){
                var inst 
                if (is_multi){
                    inst = {}
                    mod.forEach(function(m){
                        inst[m] = require(m)
                    })
                } else {
                    inst = require(mod)
                }
                cbk.call(inst)
            }

            var is_multi = global.util.isArray(mod)
            if (!is_multi) mod = [mod]     
            var need_load = []
            mod.forEach(function(m){
                if (!isModLoaded(m)) need_load.push(m)
            })
            if (0 === need_load.length) {
                return onLoad()
            } else {
                mod = need_load
            }

            if (cbk) emitter.on(appendFix(mod , ':defined') , onLoad)

            mod.forEach(function(m){
                if (async_mod.indexOf(m) === -1) async_mod.push(m)
            })

            async_timer && global.clearTimeout(async_timer)
            async_timer = global.setTimeout(function(){
                loadJS(
                     '/~' + async_mod.join('+') + '.js' 
                      /*
                     , {
                        'onLoad' : 
                         function(){
                            global.nextTick(function(){
                                async_event.forEach(function(evt){
                                    var mod = evt[0]
                                    if (isModLoaded(mod)){ 
                                        var inst = require(mod)
                                        evt[1].call(inst)
                                    } else {
                                        throw mod + ' is not defined'
                                    }
                                })
                            })
                         }
                       }
                       */
                     )
            } , 0)
        }
    }()
})(this)
