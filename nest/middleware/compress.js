
/*!
 * Connect - compress
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var zlib = require('zlib');

/**
 * Supported content-encoding methods.
 */

var methods = {
    gzip: zlib.createGzip,
    deflate: zlib.createDeflate
};


/**
 * Compress response data with gzip/deflate.
 *
 * Filter:
 *
 * A `filter` callback function may be passed to
 * replace the default logic of:
 *
 *     exports.filter = function(req, res){
 *       var type = res.getHeader('Content-Type') || '';
 *       return type.match(/json|text|javascript/);
 *     };
 *
 * Options:
 *
 *  All remaining options are passed to the gzip/deflate
 *  creation functions. Consult node's docs for additional details.
 *
 *     - `chunkSize` (default: 16*1024)
 *     - `windowBits`
 *     - `level`: 0-9 where 0 is no compression, and 9 is slow but best compression
 *     - `memLevel`: 1-9 low is slower but uses less memory, high is fast but uses more
 *     - `strategy`: compression strategy
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function compress(options) {
  var options = options || {}
    , names = Object.keys(methods)

  return function(req, res, next){
    var accept = req.headers['accept-encoding']
      , write = res.write
      , end = res.end
      , stream
      , method;

    // vary
    res.setHeader('Vary', 'Accept-Encoding');

    // proxy
	if (accept){
		names.every(function(name){
			if (accept.indexOf(name) >= 0) {
				// compression stream
				stream = methods[name](options)
				stream.on('data', function(chunk){
					write.call(res, chunk);
				});

				stream.on('end', function(){
					end.call(res);
				});

				// header fields
				res.setHeader('Content-Encoding', name)
				res.removeHeader('Content-Length')
				return false
			}
			return true
		})
	}

	res.write = function(chunk, encoding){
		if (!this.headersSent) this._implicitHeader();
		return stream
			? stream.write(chunk, encoding)
			: write.call(res, chunk, encoding);
	};

    res.end = function(chunk, encoding){
		if (chunk) this.write(chunk, encoding);
		return stream
			? stream.end()
			: end.call(res);
    };


	next();
  };
}
