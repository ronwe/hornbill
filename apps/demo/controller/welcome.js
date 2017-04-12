
var controlFns = {
	'default' : function(id ){
		return this.render(id + '.html' ,{})
		var model = this.loadModel('demo.js')
		this.bindDefault()
		this.listenOn( model.read, 'model')('a',{})
		this.listenOver(function(data){	
			//console.log(data )
			data.test =  new Date
			this.render('welcome.html' , data)
		})
	},
	'index' :function() {
		this.render('detect.html' , {})
	},
	'A' :function() {
		var java = {
			'demo': '/hello'
		}
		this.autoGenMock(true)
		this.bridgeMocks({
			'demo' : '/demo/hello.json'
		})
		this.bridgeMuch(java)
		this.listenOver(function(data){
			data.get = this.req.__get
			data.post = this.req.__post
			console.log(this.req.__post)
			return this.res.end(JSON.stringify(config,null,4))
			this.render('call.html' , {})
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
