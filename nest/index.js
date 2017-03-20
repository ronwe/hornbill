var hornbill = require('../frame')
	,path = require('path')

hornbill.start({
	'cpuNums' : 1
	//,'appsPath' : path.resolve(__dirname , '../apps') 
	,'configPath' : path.resolve(__dirname,'config')
})
console.log(hornbill)
