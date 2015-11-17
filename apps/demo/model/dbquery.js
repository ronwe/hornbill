var mysql = require('mysql')
var util = require('util')
	,extent = util._extend

var connStr = config.db.mysql.master()


function query (sql , data , cbk){
	if (!cbk) {
		cbk = data
		data = []
	}

	if (util.isObject(data)){
		//处理绑定变量
		var bindVars = sql.match(/\:(\w+)\b/g)
			,bindValues = []
		if (bindVars) {
			bindVars.forEach(function(param){
				sql = sql.replace(param , '?')
				var param_val = data[param.slice(1)] || null
				bindValues.push(param_val)
			})
			data = bindValues
		}
	}

	try {
		var connection = mysql.createConnection( connStr )
		connection.connect()
		connection.query( sql , data , function( err , data ){
			cbk(err ,data)
		})
		connection.end()
	}catch (err){
		cbk(err)
	}

}


exports.query = query
