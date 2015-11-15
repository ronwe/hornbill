
var controlFns = {
	'index' : function(id ){
		var model = this.loadModel('demo.js')
		this.bindDefault()
		this.listenOn( model.read, 'model')('from model',{})
		this.listenOver(function(data){	
			console.log(data )
			data.test =  new Date
			this.render('welcome.html' , data)
		})
	}
}

exports.__create = controller.__create(controlFns)
