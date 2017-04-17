function unescape(s, decodeSpaces) {
  var out = new Buffer(s.length);
  var state = 'CHAR'; // states: CHAR, HEX0, HEX1
  var n, m, hexchar;
  for (var inIndex = 0, outIndex = 0; inIndex <= s.length; inIndex++) {
    var c = s.charCodeAt(inIndex);
    switch (state) {
      case 'CHAR':
        switch (c) {
          case charCode('%'):
            n = 0;
            m = 0;
            state = 'HEX0';
            break;
          case charCode('+'):
            if (decodeSpaces) c = charCode(' ');
            // pass thru
          default:
            out[outIndex++] = c;
            break;
        }
        break;
      case 'HEX0':
        state = 'HEX1';
        hexchar = c;
        if (charCode('0') <= c && c <= charCode('9')) {
          n = c - charCode('0');
        } else if (charCode('a') <= c && c <= charCode('f')) {
          n = c - charCode('a') + 10;
        } else if (charCode('A') <= c && c <= charCode('F')) {
          n = c - charCode('A') + 10;
        } else {
          out[outIndex++] = charCode('%');
          out[outIndex++] = c;
          state = 'CHAR';
          break;
        }
        break;
      case 'HEX1':
        state = 'CHAR';
        if (charCode('0') <= c && c <= charCode('9')) {
          m = c - charCode('0');
        } else if (charCode('a') <= c && c <= charCode('f')) {
          m = c - charCode('a') + 10;
        } else if (charCode('A') <= c && c <= charCode('F')) {
          m = c - charCode('A') + 10;
        } else {
          out[outIndex++] = charCode('%');
          out[outIndex++] = hexchar;
          out[outIndex++] = c;
          break;
        }
        out[outIndex++] = 16 * n + m;
        break;
    }
  }
  // TODO support returning arbitrary buffers.
  return out.slice(0, outIndex - 1);
};

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
			var LZString = require('lz-string')
			var querystring = require('querystring')

			/*
			var q = this.req.url.match(/(?:\?|\&)q=(.*)(&|$)/)
			q = q ?q[1] : ''
			*/
			var q = this.req.__raw_post
	
			if (q){
				var uq = LZString.decompressFromUTF16((q))
				console.log( uq)

				return this.res.end(JSON.stringify(this.req.__get,null,4))
			}
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
