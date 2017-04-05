module.exports = function(req){
	return {  
		"response": {
			"id": 1,
			"name": "tom",
			"level": 3
		},
		"delay": 100,
		"status": 400,
		"code" : 0,
		"error": {
			"message": "该用户不存在"
		}
	}
}
