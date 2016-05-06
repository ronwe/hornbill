//var dbQuery = require('./dbquery.js')
exports.read = function(cbk ,arg1){
	/*
		dbQuery.query('select * from table where id != :id  limit 1' ,{'id' : 1} , function(err ,data){
		})
	*/
	cbk(null, arg1 + arg1)
}
