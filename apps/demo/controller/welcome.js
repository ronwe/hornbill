
var controlFns = {
	'index' : function(id ){
		var model = this.loadModel('demo.js')
		this.bindDefault()
		this.listenOn( model.read, 'model')('a',{})
		this.listenOver(function(data){	
			//console.log(data )
			data.test =  new Date
			this.render('welcome.html' , data)
		})
	},
    'demo' : function(){

        var piece = [
            {
            'piece' : 'demo/main',
            'props' : {'phrase' : 'ES6'}
            }
        ]
        /*
        `
        import Main from 'demo/main.js';
        var main = ReactDOM.render(<Main phrase="ES6" onAddClick/>, document.getElementById('example'));

        `
        */
        
	    this.render('demo.html' , {'piece': piece})
    
    }
}

exports.__create = controller.__create(controlFns)
