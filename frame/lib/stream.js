var util = require('util')
	, stream = require('stream')

function EchoStream (options) { 
	stream.Writable.call(this)
	this.options = options || {}
	if (this.options.extend) {
		util._extend(this , this.options.extend)
	}
	this.string = ''
}
util.inherits(EchoStream, stream.Writable)

EchoStream.prototype._write = function (chunk, encoding, done) { 
	this.string += chunk
  	done()
}
EchoStream.prototype.end = function(chunk){
	this.string += chunk || ''
	if (this.options.cbk) {
		this.options.cbk(this.string)
	}
}

exports.write = EchoStream
