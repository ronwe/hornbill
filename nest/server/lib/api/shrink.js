/*
 * api 接口规范
 * code 0 正常 
 */
exports.parse = function(data){
    var error = {}
    for (var key in data){
        var val = data[key]
        if (base.isString(val) && /^\{.*\}$/.test(val) ){
            try{
                val = JSON.parse(val)
            }catch(err){
                error[key] =  {'code' : 999 , 'errMsg' : err ,'raw' : val} 
                data[key] = val = false
                continue
            }
        } else if (!base.isObject(val)){
            continue
        } else if (!('code' in val)) {
            continue
        }



        if (0 == val.code ) {
            data[key] = val.data 
        }else {
            error[key] = {'code' : val.code , 'errMsg' : val.errMsg || val.data}
            data[key] = false
        }

    }
    return error

}
