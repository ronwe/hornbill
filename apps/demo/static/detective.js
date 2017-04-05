/*
 * @author rongwei 3/25/2017   
 * TODO 
 * --去掉jquery 依赖 
 * --生成guid
 * --js swf 异步加载
 * --browserWinPos 窗口位置
 * --browserWinSize	浏览器窗口大小
 *
 * --screenData	
 * --width	屏幕宽度
 * --height	屏幕高度
 * --realWidth	屏幕实际宽度
 * --realHeight	屏幕实际高度
 * --screenResolution 屏幕分辨率
 * 
 * --检测字体支持
 * --sysfonts: {}	浏览器可用字体
 * --去掉获取公网ip
 * --超时处理
 * --canvas 判断是否支持 isPointInPath
 * --canvasFingerPrint  设备的帆布指纹信息(浏览器)
 * --webGLFingerPrint  WebGL指纹 (浏览器)
 * --webRTCFingerPrint  WebRTC指纹(浏览器)
 * --CanvasData就是canvas指纹图像的murmurHash3
 * --vertexShaderBestPrecision  fragmentShaderBestPrecision 格式化
 * {}	本js最近25次的加载时间
 * 上报
 * */
;(function(){
var MAXWAITTIME = 5 //等待5秒即上报

var SIGNTEXT = 'writen by enoch in http://www.elong.com '

var UALIB = '/js/ua-parser.min.js'
var WEBRTCLIB = '/js/DetectRTC.min.js'
var WEBGLLIB = '/js/gl-info.js'
var FLASHLIB = '/js/swfobject.js'
/*
*browserPlatform 浏览器运行的操作平台
osArch	操作系统架构
browserPlatform	浏览器运行的操作平台
architecture	浏览器所在的操作系统信息
DeviceType	设备类型
Browser	浏览器类型
*/
const UNKOWNKEY = 'unkown'

function serialize(object){
	var ret = []		
	for (var key in object){
		ret.push( key + '=' + object[key].toString())
	}
	return ret.join('&')
		
}

function syncLoadScript(url ,done){
	var script = document.createElement('script')
	script.src = url 
	script.onload = done

	document.head.appendChild(script)
}
//位置
/*
 * 获取公网ip http://freegeoip.net/json/?callback=
 * ip	IP
 * country	国家
 * timeZone	时区
 * longitude	经纬度
 * time	设备时间
 */

/*
function getPosInfo(done){
	$.getJSON('http://freegeoip.net/json/?callback=?' , function(data){
		var result = {}
		result.ip = data.ip
		result.country = data.country_name
		result.timeZone = data.time_zone
		result.longitude = data.longitude
		result.latitude = data.latitude
		done(result)
	})
}
*/

/*
 * 生成guid
 * */
function genGuid(){
	return (+new Date).toString(36) + '-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			    return v.toString(16);
	})
}
/*
* timeZone
* time
**/
function getTimeInfo(done){
	var time = new Date
	done({
		time : time.getTime(), 
		timeZone : time.getTimezoneOffset()/60
	})	
}
/*
* gps
* longitude 
* latitude
*/
function getGeoInfo(done){
	var err_result = {
		'gps' : false,
		'longitude' : UNKOWNKEY,
		'latitude': UNKOWNKEY
	}
	if (!navigator.geolocation) return done(err_result)
	navigator.geolocation.getCurrentPosition(function(pos){

		done({
			'gps' : true,
			'longitude' : pos.coords.longitude,
			'latitude': pos.coords.latitude 
			
		})
	},function(error){
		done(err_result)

	},{timeout:1000})

}
/*
* parse form UA https://github.com/faisalman/ua-parser-js
*osArch	操作系统架构
*osName	操作系统名称
*osVersion	操作系统版本
*osType	操作系统类型
*osLanguage	用户设置的操作系统语言
*Browser	浏览器类型
*architecture	浏览器所在的操作系统信息
*DeviceType	设备类型
*browserPlatform	浏览器运行的操作平台
*pixelRatio	像素纵横比

*浏览器		
*browserName	浏览器名称 
*browserVerdor	浏览器厂商
*browserKernel	浏览器内核
*browserVersion	浏览器版本
*userAgent	浏览器信息（User-Agent）
*browserEngine	浏览器引擎
*acceptEncoding	浏览器编码
*/
function getUAInfo(done){
	syncLoadScript(UALIB , function(){
		var parser = new UAParser()
		var ua_info = parser.getResult()
		done({
			osArch : getCPU() || UNKOWNKEY,
			osName : ua_info.os.name,
			osVersion : ua_info.os.version ,
			architecture: ua_info.cpu.architecture || UNKOWNKEY,
			Browser: ua_info.browser.name,
			DeviceType:ua_info.device.type ,
			browserPlatform : ua_info.engine.name,
			browserName : ua_info.browser.name, 
			browserEngine : ua_info.engine.name,
			browserVersion : ua_info.browser.version ,
		})
	})
}

function getNavigatorInfo(done){
	done({
		osLanguage : navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage || UNKOWNKEY,
		osType : navigator.platform || UNKOWNKEY,
		ua : navigator.userAgent,
		pixelRatio : window.devicePixelRatio,

		browserVerdor : navigator.vendor,
		browserKernel : navigator.appName,
		userAgent : navigator.userAgent,
		
		acceptEncoding :  document.characterSet || document.charset,
			

	})
}
function getCPU(){
	var agent=navigator.userAgent.toLowerCase();
	if(agent.indexOf("win64")>=0||agent.indexOf("wow64")>=0) return "x64";
	return navigator.cpuClass;
}
/*
*sessionStorage	临时数据保存大小
*localStorage	局部存储器大小
*alterBrowser	用户是否篡改了浏览器
*supportJS	是否支持JS内容编码
*supportImage	是否支持image
*canvasFingerPrint	设备的帆布指纹信息(浏览器)
*html5	html5支持情况
*css3	css3支持情况
*httpAccept	http accept头部
*frontNo	浏览器字体编号
*browserLanguage	浏览器语言
*browserWinPos	浏览器窗口位置
*browserWinSize	浏览器窗口大小
*/
function getSupportInfo(done){
	// Feature detect + local reference
	var support_storage = (function() {
		var uid = new Date
		var result
		try {
			localStorage.setItem(uid, uid)
			result = localStorage.getItem(uid) == uid
			localStorage.removeItem(uid)
			return result && localStorage
		} catch (exception) {}
	}())	
	var support_sessionStorage = (function() {
		var uid = new Date
		var result
		try {
			sessionStorage.setItem(uid, uid)
			result = sessionStorage.getItem(uid) == uid
			sessionStorage.removeItem(uid)
			return result && sessionStorage 
		} catch (exception) {}
	}())	

	var size_localStorage = (function(){
		if (support_storage) {
			var _lsTotal=0,_xLen,_x;
			for(_x in localStorage){
				_xLen= ((localStorage[_x].length + _x.length)* 2)
				_lsTotal+=_xLen
			}
			return _lsTotal
		}else{
			return  UNKOWNKEY
		}
	}())
	var size_sessionStorage = (function(){
		if (support_sessionStorage) {
			var _lsTotal=0,_xLen,_x;
			for(_x in sessionStorage){
				_xLen= ((sessionStorage[_x].length + _x.length)* 2)
				_lsTotal+=_xLen
			}
			return _lsTotal
		}else{
			return  UNKOWNKEY
		}
	}())

	done({		
		localStorage :  size_localStorage,
		sessionStorage : size_sessionStorage,
		alterBrowser : getHasLiedBrowser(),
		browserLanguage : navigator.language	,
		supportJS : true,
		canvasFingerPrint : isCanvasSupported(), 
		html5 : isAttributeSupported("input", "placeholder"),
		css3 : cssSupport('textShadow'),
		browserWinPos : serialize(getWindowPos()),
		browserWinSize : serialize(getWindowSize()),
		supportCookie : navigator.cookieEnabled,

	})
}

// Given a string and an optional seed as an int, returns a 128 bit
// hash using the x64 flavor of MurmurHash3, as an unsigned hex.
  
function murmurhash3_32_gc(key, seed) {
	var remainder, bytes, h1, h1b, c1, c2, k1, i;

	remainder = key.length & 3; // key.length % 4
	bytes = key.length - remainder;
	h1 = seed;
	c1 = 0xcc9e2d51;
	c2 = 0x1b873593;
	i = 0;

	while (i < bytes) {
		k1 =
			((key.charCodeAt(i) & 0xff)) |
			((key.charCodeAt(++i) & 0xff) << 8) |
			((key.charCodeAt(++i) & 0xff) << 16) |
			((key.charCodeAt(++i) & 0xff) << 24);
		++i;

		k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
		k1 = (k1 << 15) | (k1 >>> 17);
		k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

		h1 ^= k1;
		h1 = (h1 << 13) | (h1 >>> 19);
		h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
		h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
	}

	k1 = 0;

	switch (remainder) {
		case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
		case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
		case 1: k1 ^= (key.charCodeAt(i) & 0xff);

				k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
				k1 = (k1 << 15) | (k1 >>> 17);
				k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
				h1 ^= k1;
	}

	h1 ^= key.length;

	h1 ^= h1 >>> 16;
	h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
	h1 ^= h1 >>> 13;
	h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
	h1 ^= h1 >>> 16;

	return h1 >>> 0;
}
/*
* canvasFingerPrint
* canvasWinding
* canvasData
*/
function getCanvasInfo(done){
	if (!isCanvasSupported()) return done({})
	var canvas = document.createElement("canvas")
	var ctx =  canvas.getContext("2d")
	
	var murmur = (function(){	
		var keys = []

		var txt = SIGNTEXT
		ctx.textBaseline = "top"
		ctx.font = "14px 'Arial'"
		ctx.textBaseline = "alphabetic"
		ctx.fillStyle = "#f60"
		ctx.fillRect(125,1,62,20)
		ctx.fillStyle = "#069"
		ctx.fillText(txt, 2, 15)
		ctx.fillText("width +" + ctx.measureText(SIGNTEXT), 10, 100)
		ctx.fillStyle = "rgba(102, 204, 0, 0.7)"
		ctx.fillText(txt, 4, 17)
		keys.push(canvas.toDataURL())

		return  murmurhash3_32_gc(keys.join('###') , 31)
	})()
	
	done({
		canvasWinding : !!ctx.isPointInPath,
		canvasData : murmur 
	})
}
/*
*用户操作相关信息
Connection	是否在线
historyLength	当前浏览历史长度

numMimeTypes	MimeType数量
numPlugins	plugin数量
useragent	UA头
plugins	plugin具体信息 fileName:文件名, pluginName:plugin名, Description:描述, Version:版本
language	语言
vendor	当前所使用浏览器的浏览器供应商的名称
mimeTypes	mimeType具体信息 type:类型, Description:描述
appVersion	当前浏览器版本
numCPU	CPU核心数
appName	当前浏览器官方名称
appCodeName	当前浏览器的内部“开发代号”名称
cookieEnabled	浏览器是否启用cookie
doNotTrack	是否允许跟踪,如果用户不允许网站,内容和广告等进行跟踪,则该值为yes.
cpuClass	浏览器系统的CPU 等级
platform	览器所在的系统平台类型
product	当前浏览器的产品名称 注意：该属性不一定返回一个真实的产品名称。Gecko 和 WebKit 浏览器返回 "Gecko" 作为该属性的值。
productSub	当前浏览器的构建号
vendorSub	vendor的值的一部分,表示浏览器供应商的版本号
buildID	当前浏览器buildId

*/
function getNavInfo(done){
	if (navigator.mimeTypes){
		var mimeTypes = []
		for (var i = 0 ; i< navigator.mimeTypes.length; i++){
			var mime_type = navigator.mimeTypes[i]
			mimeTypes.push('type:' +  mime_type.type +  ',Description:' + mime_type.description + ';')
		}
		mimeTypes = mimeTypes.join('\n') 
	}
	if (navigator.plugins){
		var plugins = []
		for (var i = 0 ; i < navigator.plugins.length; i++){
			var plug = navigator.plugins[i]
			plugins.push('fileName:' + plug.filename + 
				',pluginName:' +  plug.name + 
				',Description:描述' + plug.description +
				', Version:' + plug.version +
				';')
		}
		plugins = plugins.join('\n')
	}
	done({
		Connection : navigator.onLine || UNKOWNKEY,
		historyLength : history.length , 
		numMimeTypes : navigator.mimeTypes ? navigator.mimeTypes.length : UNKOWNKEY,
		mimeTypes : mimeTypes || UNKOWNKEY,
		useragent : navigator.userAgent,
		plugins : plugins || UNKOWNKEY,
		language :  navigator.language  || UNKOWNKEY,
		vendor : navigator.vendor || UNKOWNKEY,
		appVersion : navigator.appVersion || UNKOWNKEY,
		numCPU : navigator.hardwareConcurrency || UNKOWNKEY,
		appName : navigator.appName || UNKOWNKEY,
		appCodeName : navigator.appCodeName || UNKOWNKEY,
		cookieEnabled : navigator.cookieEnabled	,
		doNotTrack : !!navigator.doNotTrack,
		cpuClass : navigator.cpuClass || UNKOWNKEY,
		platform : navigator.platform ,
		product : navigator.product,
		productSub : navigator.productSub,	
		vendorSub : navigator.vendorSub,
		buildID : navigator.buildID || UNKOWNKEY,
		
	})

}
/*
screenData	
width	屏幕宽度
height	屏幕高度
availWidth	浏览器可用宽度
availHeight	浏览器可用高度
colorDepth	屏幕颜色深度
pixelDensity	设备像素
pixel	像素密度
pixelDepth	屏幕的位深度/色彩深度
devicePixelRatio	物理像素在当前显示的设备(垂直)上的一个独立像素的比例
realWidth	屏幕实际宽度
realHeight	屏幕实际高度
sysfonts: {}	浏览器可用字体
screenResolution	屏幕分辨率
screenSize	屏幕大小
dpi	屏幕点距
screenColorDepth	屏幕颜色位数
*/
function getScreenData(done){
	var fonts_list  = fontSupported()
	var dpi = getScreenDPI()
	done({
		width : screen.width,
		height : screen.height,
		availWidth : screen.availWidth ,
		availHeight : screen.availHeight,
		realWidth : document.documentElement.clientWidth ,
		realHeight : document.documentElement.clientHeight,
		colorDepth : screen.colorDepth ,
		pixelDepth : screen.pixelDepth,		
		devicePixelRatio : getDevicePixelRatio(),
		sysfonts : fonts_list,
		screenResolution : screen.width + 'x' + screen.height,
		
		dpi : dpi.x + ',' + dpi.y ,
	})
}
/*
webGL	
	浏览器WebGL相关
isSupported	是否支持webGL
WebGLVendor	WebGL供应商名称
WebGLRenderer	WEBGL渲染器名称
unMaskedVendor	显卡厂商
unMaskedRenderer	具体显卡的信息
maxColorBuffers	
isEnabled	是否支持STENCIL_TEST
contextNames	支持的webgl context名称
glVersion	支持的webgl版本
shadingLanguageVersion	
redBits	
greenBits	
blueBits	
alphaBits	
maxRenderBufferSize	
maxCombinedTextureImageUnits	
maxCubeMapTextureSize	
maxFragmentUniformVectors	
maxTextureImageUnits	
maxTextureSize	
maxVaryingVectors	
maxVertexAttributes	
maxVertexUniformVectors	
aliasedLineWidthRange	
aliasedPointSizeRange	
maxViewportDimensions	
maxAnisotropy	
vertexShaderBestPrecision	
maxVertexTextureImageUnits	
fragmentShaderBestPrecision	
depthBits	
stencilBits	
fragmentShaderFloatIntPrecision	
extensions	当前浏览器支持的WebGL扩展列表
hardwareConcurrency	CPU核心数
webGLFingerPrint	WebGL指纹 (浏览器)
webGLVersion	WebGL版本
*/
function getWebGLInfo(done){
	var isSupported = isWebGlSupported()
	if (!isSupported){
		return done({isSupported : false})
	}
	syncLoadScript(WEBGLLIB , function(){
		var detail =  glInfo() || {}
		done({
			isSupported :  isSupported ,
			WebGLVendor : detail.vendor ,
			WebGLRenderer: detail.renderer ,
			unMaskedVendor : detail.unMaskedVendor ,
			unMaskedRenderer : detail.unMaskedRenderer ,
			maxColorBuffers : detail.maxColorBuffers ,
			contextNames : detail.contextName ,
			glVersion : detail.glVersion ,
			shadingLanguageVersion : detail.shadingLanguageVersion ,
			redBits : detail.redBits ,
			greenBits : detail.greenBits,
			blueBits : detail.blueBits ,
			alphaBits : detail.alphaBits ,
			maxRenderBufferSize : detail.maxRenderBufferSize ,
			maxCombinedTextureImageUnits : detail.maxVertexTextureImageUnits ,
			maxCubeMapTextureSize : detail.maxCubeMapTextureSize,
			maxFragmentUniformVectors : detail.maxFragmentUniformVectors,
			maxTextureImageUnits : detail.maxTextureImageUnits ,
			maxTextureSize : detail.maxTextureSize,
			maxVaryingVectors : detail.maxVaryingVectors ,

			maxVertexAttributes : detail.maxVertexAttributes ,
			maxVertexUniformVectors : detail.maxVertexUniformVectors,
			aliasedLineWidthRange :  serialize(detail.aliasedLineWidthRange),
			aliasedPointSizeRange : serialize(detail.aliasedPointSizeRange) , 
			maxViewportDimensions: detail.maxViewportDimensions.join(',') ,
			maxAnisotropy : detail.maxAnisotropy,
			vertexShaderBestPrecision : serialize(detail.vertexShaderBestPrecision) ,
			maxVertexTextureImageUnits: detail.maxVertexTextureImageUnits ,
			fragmentShaderBestPrecision: serialize(detail.fragmentShaderBestPrecision),
			depthBits: detail.depthBits,
			stencilBits: detail.stencilBits,
			fragmentShaderFloatIntPrecision: detail.fragmentShaderFloatIntPrecision,
			extensions: detail.extensions.join(',') ,
			hardwareConcurrency: navigator.hardwareConcurrency, 
			webGLVersion: detail.webglVersion,
			webGLFingerPrint : webglSign()
		})
	})
	function getWebglCanvas() {
      var canvas = document.createElement("canvas");
      var gl = null;
      try {
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      } catch(e) { /* squelch */ }
      if (!gl) { gl = null; }
      return gl;
    }

	function webglSign(){
		var keys = []
		var gl;
		var fa2s = function(fa) {
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			return "[" + fa[0] + ", " + fa[1] + "]";
		};
		gl = getWebglCanvas();
		if(!gl) { return null; }
		// WebGL fingerprinting is a combination of techniques, found in MaxMind antifraud script & Augur fingerprinting.
		// First it draws a gradient object with shaders and convers the image to the Base64 string.
		// Then it enumerates all WebGL extensions & capabilities and appends them to the Base64 string, resulting in a huge WebGL string, potentially very unique on each device
		// Since iOS supports webgl starting from version 8.1 and 8.1 runs on several graphics chips, the results may be different across ios devices, but we need to verify it.
		var result = [];
		var vShaderTemplate = "attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}";
		var fShaderTemplate = "precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}";
		var vertexPosBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
		var vertices = new Float32Array([-.2, -.9, 0, .4, -.26, 0, 0, .732134444, 0]);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
		vertexPosBuffer.itemSize = 3;
		vertexPosBuffer.numItems = 3;
		var program = gl.createProgram(), vshader = gl.createShader(gl.VERTEX_SHADER);
		gl.shaderSource(vshader, vShaderTemplate);
		gl.compileShader(vshader);
		var fshader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fshader, fShaderTemplate);
		gl.compileShader(fshader);
		gl.attachShader(program, vshader);
		gl.attachShader(program, fshader);
		gl.linkProgram(program);
		gl.useProgram(program);
		program.vertexPosAttrib = gl.getAttribLocation(program, "attrVertex");
		program.offsetUniform = gl.getUniformLocation(program, "uniformOffset");
		gl.enableVertexAttribArray(program.vertexPosArray);
		gl.vertexAttribPointer(program.vertexPosAttrib, vertexPosBuffer.itemSize, gl.FLOAT, !1, 0, 0);
		gl.uniform2f(program.offsetUniform, 1, 1);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPosBuffer.numItems);
		
		keys.push(gl.canvas.toDataURL())
		if (gl.canvas != null) { 
			return murmurhash3_32_gc(keys.join('###'),31)
		 }
	}
}
/*
webRtc	
shouldBeSupported	是否支持webRtc
deviceEnum	媒体设备是否可以枚举
mediaSources	媒体设备：id, kind, label, groupid
AudioContext	window对象是否支持AudioContext
deviceCount	设备数
hasMic	是否有mic
hasWebcam	是否有摄像头
hasSpeaker	是否支持音频输出
IceSupport	是否支持onicecandidate事件
IceCandidates	Ice Candidates数据
IPADDR	本地IP地址
webRTCFingerPrint	WebRTC指纹(浏览器)
//http://www.52bug.cn/post-2446.html
*/
function getWebRtcInfo(done){
	syncLoadScript(WEBRTCLIB , function(){
		var detect_RTC = DetectRTC
		detect_RTC.DetectLocalIPAddress(function(ip){
			var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection
			var offerer = new RTCPeerConnection({
                    iceServers: []
                })
			offerer.createDataChannel('' , {reliable:false})
			offerer.onicecandidate= function(evt){
				//console.log('evt' , evt)
			}
		
			offerer.createOffer(function(offerDesc){
				//var webrtc_hash = murmurhash3_32_gc([offerDesc.sdp].join('###') , 31)

			},function(err){
				//console.log('offer failed' ,err)
			})
			// RTCPeerConnection.indexOf(onicecandidate)
			
			done({
				shouldBeSupported : detect_RTC.isWebRTCSupported,
				deviceEnum  : detect_RTC.MediaDevices.length,
				//mediaSources : detect_RTC.
				//AudioContext : detect_RTC.
				//deviceCount : detect_RTC.
				hasMic : detect_RTC.hasMicrophone , 
				hasWebcam : detect_RTC.hasWebcam ,
				hasSpeaker : detect_RTC.hasSpeakers ,
				IceSupport : 'onicecandidate' in offerer,
				//IceCandidates : detect_RTC.
				webRTCFingerPrint : murmurhash3_32_gc(ip,3) ,
				IPADDR : ip
			})
		})
	})
}
/*
browserType	
isOpera	是否opera浏览器
isFirefox	是否firefox浏览器
isSafari	是否safari浏览器
isIE	是否IE
isEdge	是否Edge
isChrome	是否chrome
isBlink	是否blink
isWebKit	是否webkit
isWeixin	是否微信
isQQ	是否QQ
*/
function getBrowserType(done){
	var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
	// Firefox 1.0+
	var isFirefox = typeof InstallTrigger !== 'undefined';

	// Safari 3.0+ "[object HTMLElementConstructor]" 
	var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);

	// Internet Explorer 6-11
	var isIE = /*@cc_on!@*/false || !!document.documentMode;

	// Edge 20+
	var isEdge = !isIE && !!window.StyleMedia;

	// Chrome 1+
	var isChrome = !!window.chrome && !!window.chrome.webstore;

	// Blink engine detection
	var isBlink = (isChrome || isOpera) && !!window.CSS;	
	
	var ua = navigator.userAgent
	//https://github.com/jack-Lo/ez-client/blob/master/index.js
	var isWebKit = ua.indexOf('AppleWebKit') != -1
	var isWeixin = !!ua.match(/MicroMessenger/i)
	var isQQ = !!ua.match(/QQBrowser/i)
	done({
		isOpera : isOpera,
		isFirefox : isFirefox,
		isSafari : isSafari,
		isIE : isIE ,
		isEdge : isEdge,
		isChrome : isChrome,
		isBlink : isBlink,
		isWebKit : isWebKit,
		isWeixin :isWeixin,
		isQQ : isQQ
	})
}

/*
performanceTiming	
navigationStart	在同一个浏览器上下文中，前一个网页 unload 的时间戳
unloadEventStart	前一个网页unload的时间戳
unloadEventEnd	和unloadEventStart 相对应，返回前一个网页unload事件绑定的回调函数执行完毕的时间戳
redirectStart	第一个HTTP重定向发生时的时间。有跳转且是同域名内的重定向才算，否则值为 0
redirectEnd	最后一个 HTTP 重定向完成时的时间。有跳转且是同域名内部的重定向才算，否则值为0
fetchStart	浏览器准备好使用HTTP请求抓取文档的时间，这发生在检查本地缓存之前
domainLookupStart	DNS域名查询开始的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等
domainLookupEnd	DNS域名查询完成的时间，如果使用了本地缓存（即无 DNS 查询）或持久连接，则与 fetchStart 值相等
connectStart	HTTP(TCP)开始建立连接的时间，如果是持久连接，则与 fetchStart 值相等, 注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接开始的时间
connectEnd	HTTP（TCP） 完成建立连接的时间（完成握手），如果是持久连接，则与 fetchStart 值相等, 注意如果在传输层发生了错误且重新建立连接，则这里显示的是新建立的连接完成的时间, 注意这里握手结束，包括安全连接建立完成、SOCKS 授权通过
secureConnectionStart	HTTPS 连接开始的时间，如果不是安全连接，则值为 0
responseStart	HTTP 请求读取真实文档开始的时间（完成建立连接），包括从本地读取缓存。连接错误重连时，这里显示的也是新建立连接的时间
responseEnd	HTTP 开始接收响应的时间（获取到第一个字节），包括从本地读取缓存
domLoading	HTTP 响应全部接收完成的时间（获取到最后一个字节），包括从本地读取缓存
domInteractive	开始解析渲染 DOM 树的时间。此时 Document.readyState 变为 loading，并将抛出 readystatechange 相关事件
domContentLoadedEventStart	完成解析 DOM 树的时间, Document.readyState 变为 interactive，并将抛出 readystatechange 相关事件, 注意只是 DOM 树解析完成，这时候并没有开始加载网页内的资源
domContentLoadedEventEnd	DOM 解析完成后，网页内资源加载开始的时间，在 DOMContentLoaded 事件抛出前发生
domComplete	DOM 树解析完成，且资源也准备就绪的时间。 Document.readyState 变为 complete，并将抛出 readystatechange 相关事件
loadEventStart	load 事件发送给文档，也即 load 回调函数开始执行的时间。注意如果没有绑定 load 事件，值为 0
loadEventEnd	load 事件的回调函数执行完毕的时间
*/
function getPerformaceInfo(done){
	var performance = window.performance || window.mozPerformance || window.msPerformance || window.webkitPerformance || {}
	var timing = performance.timing || {}
	done({
		navigationStart : timing.unloadEventStart ,
		unloadEventStart : timing.unloadEventStart,
		unloadEventEnd : timing.unloadEventEnd,
		redirectStart : timing.redirectStart , 
		redirectEnd : timing.redirectEnd ,
		fetchStart : timing.fetchStart ,
		domainLookupStart : timing.domainLookupStart ,
		domainLookupEnd : timing.domainLookupEnd,
		connectStart : timing.connectStart , 
		connectEnd : timing.connectEnd , 
		secureConnectionStart : timing.secureConnectionStart ,
		responseStart : timing.responseStart , 
		responseEnd : timing.responseEnd, 
		domLoading : performance.domLoading , 
		domInteractive : performance.domInteractive ,
		domContentLoadedEventStart : performance.domContentLoadedEventStart ,
		domContentLoadedEventEnd : performance.domContentLoadedEventEnd ,
		domComplete : performance.domComplete , 
		loadEventStart : performance.loadEventStart ,
		loadEventEnd : performance.loadEventEnd

	})
}
/*
other	
adblock	是否装有adblock插件
hasLiedLanguages	判断language是否作伪
hasLiedResolution	分辨率是否作伪
hasLiedOs	判断操作系统是否作伪
*/

function getOtherInfo(done){
	done({
		adblock : getAdBlock(),
		hasLiedLanguages :  getHasLiedLanguages(),
		hasLiedResolution : getHasLiedResolution(),
		hasLiedOs : getHasLiedOs() 
	})

}
function getFlashInfo(done){
	if (!getFlashSupport()) return done({})

	syncLoadScript(FLASHLIB , function(){
		swfobject.registerObject("myId", "9.0.0", "expressInstall.swf");
		window.flashInfo = function(info){
			try{
				var flash_env = JSON.parse(info)
				flash_env.flashVersion =  getFlashVersion()
				done(flash_env)
			}catch(err){
				done({})	
			}
		}
		
		var div = document.createElement('div')	
		div.style.cssText = 'height: 0; left: -1000%; position: absolute; top: -100%; width: 0;overflow:hidden;'

		var strVar="";
		strVar += "<object id=\"myId\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\"3\" height=\"1\">";
		strVar += "                <param name=\"movie\" value=\"/test.swf\" \/>";
		strVar += "                <!--[if !IE]>-->";
		strVar += "                <object type=\"application\/x-shockwave-flash\" data=\"/test.swf\" width=\"3\" height=\"1\">";
		strVar += "                    <!--<![endif]-->";
		strVar += "                    <div>";
		strVar += "                        <h1>Alternative content<\/h1>";
		strVar += "                        <p><a href=\"http:\/\/www.adobe.com\/go\/getflashplayer\"><img src=\"http:\/\/www.adobe.com\/images\/shared\/download_buttons\/get_flash_player.gif\" alt=\"Get Adobe Flash player\" \/><\/a><\/p>";
		strVar += "                    <\/div>";
		strVar += "                    <!--[if !IE]>-->";
		strVar += "                <\/object>";
		strVar += "                <!--<![endif]-->";
		strVar += "            <\/object>";
		div.innerHTML = strVar 
			
		document.body.appendChild(div)
		
	})
}

function getWindowSize(){
	var viewWidth = (typeof window.innerWidth === "number") ? window.innerWidth : document.documentElement.clientWidth;
	var viewHeight = (typeof window.innerHeight === "number") ? window.innerHeight : document.documentElement.clientHeight;
	return {'width' : viewWidth,'height' : viewHeight}
}
function getWindowPos(){
	var leftPos = (typeof window.screenLeft === "number") ? window.screenLeft : window.screenX;
	var topPos = (typeof window.screenTop === "number") ? window.screenTop : window.screenY;
	return {'left' : leftPos , 'top' : topPos}
}
function getDevicePixelRatio() {
	var ratio = 1;
	// To account for zoom, change to use deviceXDPI instead of systemXDPI
	if (window.screen.systemXDPI !== undefined && window.screen.logicalXDPI       !== undefined && window.screen.systemXDPI > window.screen.logicalXDPI) {
		// Only allow for values > 1
		ratio = window.screen.systemXDPI / window.screen.logicalXDPI;
	}
	else if (window.devicePixelRatio !== undefined) {
		ratio = window.devicePixelRatio;
	}
	return ratio;
};
function getFlashSupport(){

	var hasFlash = false;
	try {
		var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
		if (fo) {
			hasFlash = true;
		}
	} catch (e) {
		if (navigator.mimeTypes
				&& navigator.mimeTypes['application/x-shockwave-flash'] != undefined
				&& navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
			hasFlash = true;
		}
	}
	return hasFlash
}
function getAdBlock(){
	var ads = document.createElement("div");
	ads.innerHTML = "&nbsp;";
	ads.className = "adsbox";
	var result = false;
	try {
		// body may not exist, that's why we need try/catch
		document.body.appendChild(ads);
		result = document.getElementsByClassName("adsbox")[0].offsetHeight === 0;
		document.body.removeChild(ads);
	} catch (e) {
		result = false;
	}
	return result;
}
function isCanvasSupported() {
	var elem = document.createElement("canvas");
	return !!(elem.getContext && elem.getContext("2d"));
}
function isWebGlSupported() {
	// code taken from Modernizr
	if (!isCanvasSupported()) {
		return false;
	}

	var canvas = document.createElement("canvas"),
	glContext;

	try {
		glContext = canvas.getContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
	} catch(e) {
		glContext = false;
	}

	return !!window.WebGLRenderingContext && !!glContext;
}
function getScreenDPI(){
	var div = document.createElement('div') 
	div.style.cssText = 'height: 1in; left: -100%; position: absolute; top: -100%; width: 1in;'

	document.body.appendChild(div)

	var dpi = {
		x : div.offsetWidth,
		y : div.offsetHeight
	}
	document.body.removeChild(div)
	return dpi

}

function getFlashVersion(){
	// ie
	try {
		try {
			// avoid fp6 minor version lookup issues
			// see: http://blog.deconcept.com/2006/01/11/getvariable-setvariable-crash-internet-explorer-flash-6/
			var axo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
			try { axo.AllowScriptAccess = 'always'; }
			catch(e) { return '6,0,0'; }
		} catch(e) {}
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version').replace(/\D+/g, ',').match(/^,?(.+),?$/)[1];
		// other browsers
	} catch(e) {
		try {
			if(navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin){
				return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
			}
		} catch(e) {}
	}
	return '0,0,0';
}

function supportImage(done){
	var img = new Image
	img.onload = function(){
		done({supportImage : true})
	}
	img.onerror = function(){
		done({supportImage : false})
	}
	img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=='
}

function isAttributeSupported(tagName, attrName) {
	var val = false;
	// Create element
	var input = document.createElement(tagName);
	// Check if attribute (attrName)
	// attribute exists
	if (attrName in input) {
		val = true;
	}
	// Delete "input" variable to
	// clear up its resources
	delete input;
	// Return detected value
	return val;
}


var cssSupport = (function() {  
	var div = document.createElement('div'),  
	vendors = 'Khtml Ms O Moz Webkit'.split(' '),  
	len = vendors.length;  

	return function(prop) {  
		if ( prop in div.style ) return true;  

		prop = prop.replace(/^[a-z]/, function(val) {  
			return val.toUpperCase();  
		});  

		while(len--) {  
			if ( vendors[len] + prop in div.style ) {  
				// browser supports box-shadow. Do what you need.  
				// Or use a bang (!) to test if the browser doesn't.  
				return true;  
			}   
		}  
		return false;  
	};  
})()

function getHasLiedLanguages(){
	//We check if navigator.language is equal to the first language of navigator.languages
	if(typeof navigator.languages !== "undefined"){
		try {
			var firstLanguages = navigator.languages[0].substr(0, 2);
			if(firstLanguages !== navigator.language.substr(0, 2)){
				return true;
			}
		} catch(err) {
			return true;
		}
	}
	return false;
}
function getHasLiedResolution(){
	if(screen.width < screen.availWidth){
		return true;
	}
	if(screen.height < screen.availHeight){
		return true;
	}
	return false;
}
function getHasLiedOs(){
	var userAgent = navigator.userAgent.toLowerCase();
	var oscpu = navigator.oscpu;
	var platform = navigator.platform.toLowerCase();
	var os;
	//We extract the OS from the user agent (respect the order of the if else if statement)
	if(userAgent.indexOf("windows phone") >= 0){
		os = "Windows Phone";
	} else if(userAgent.indexOf("win") >= 0){
		os = "Windows";
	} else if(userAgent.indexOf("android") >= 0){
		os = "Android";
	} else if(userAgent.indexOf("linux") >= 0){
		os = "Linux";
	} else if(userAgent.indexOf("iphone") >= 0 || userAgent.indexOf("ipad") >= 0 ){
		os = "iOS";
	} else if(userAgent.indexOf("mac") >= 0){
		os = "Mac";
	} else{
		os = "Other";
	}
	// We detect if the person uses a mobile device
	var mobileDevice;
	if (("ontouchstart" in window) ||
			(navigator.maxTouchPoints > 0) ||
			(navigator.msMaxTouchPoints > 0)) {
		mobileDevice = true;
	} else{
		mobileDevice = false;
	}

	if(mobileDevice && os !== "Windows Phone" && os !== "Android" && os !== "iOS" && os !== "Other"){
		return true;
	}

	// We compare oscpu with the OS extracted from the UA
	if(typeof oscpu !== "undefined"){
		oscpu = oscpu.toLowerCase();
		if(oscpu.indexOf("win") >= 0 && os !== "Windows" && os !== "Windows Phone"){
			return true;
		} else if(oscpu.indexOf("linux") >= 0 && os !== "Linux" && os !== "Android"){
			return true;
		} else if(oscpu.indexOf("mac") >= 0 && os !== "Mac" && os !== "iOS"){
			return true;
		} else if(oscpu.indexOf("win") === 0 && oscpu.indexOf("linux") === 0 && oscpu.indexOf("mac") >= 0 && os !== "other"){
			return true;
		}
	}

	//We compare platform with the OS extracted from the UA
	if(platform.indexOf("win") >= 0 && os !== "Windows" && os !== "Windows Phone"){
		return true;
	} else if((platform.indexOf("linux") >= 0 || platform.indexOf("android") >= 0 || platform.indexOf("pike") >= 0) && os !== "Linux" && os !== "Android"){
		return true;
	} else if((platform.indexOf("mac") >= 0 || platform.indexOf("ipad") >= 0 || platform.indexOf("ipod") >= 0 || platform.indexOf("iphone") >= 0) && os !== "Mac" && os !== "iOS"){
		return true;
	} else if(platform.indexOf("win") === 0 && platform.indexOf("linux") === 0 && platform.indexOf("mac") >= 0 && os !== "other"){
		return true;
	}

	if(typeof navigator.plugins === "undefined" && os !== "Windows" && os !== "Windows Phone"){
		//We are are in the case where the person uses ie, therefore we can infer that it's windows
		return true;
	}

	return false;
}
function getHasLiedBrowser() {
	var userAgent = navigator.userAgent.toLowerCase();
	var productSub = navigator.productSub;

	//we extract the browser from the user agent (respect the order of the tests)
	var browser;
	if(userAgent.indexOf("firefox") >= 0){
		browser = "Firefox";
	} else if(userAgent.indexOf("opera") >= 0 || userAgent.indexOf("opr") >= 0){
		browser = "Opera";
	} else if(userAgent.indexOf("chrome") >= 0){
		browser = "Chrome";
	} else if(userAgent.indexOf("safari") >= 0){
		browser = "Safari";
	} else if(userAgent.indexOf("trident") >= 0){
		browser = "Internet Explorer";
	} else{
		browser = "Other";
	}

	if((browser === "Chrome" || browser === "Safari" || browser === "Opera") && productSub !== "20030107"){
		return true;
	}

	var tempRes = eval.toString().length;
	if(tempRes === 37 && browser !== "Safari" && browser !== "Firefox" && browser !== "Other"){
		return true;
	} else if(tempRes === 39 && browser !== "Internet Explorer" && browser !== "Other"){
		return true;
	} else if(tempRes === 33 && browser !== "Chrome" && browser !== "Opera" && browser !== "Other"){
		return true;
	}

	//We create an error to see how it is handled
	var errFirefox;
	try {
		throw "a";
	} catch(err){
		try{
			err.toSource();
			errFirefox = true;
		} catch(errOfErr){
			errFirefox = false;
		}
	}
	if(errFirefox && browser !== "Firefox" && browser !== "Other"){
		return true;
	}
	return false;
}
/*
* 电池
*batteryLevel	电池电量
*dischargingTime	电池使用时间
*chargeState	充电状态 
**/
function getBatteryInfo(done){
	var battery = navigator.battery || navigator.mozBattery || navigator.webkitBattery
	if (!battery) return done({
		batteryLevel : UNKOWNKEY ,
		chargeState : UNKOWNKEY,
		dischargingTime : UNKOWNKEY,
	})
	done({
		batteryLevel :  battery.level,
		chargeState : battery.charging,
		dischargingTime : battery.dischargingTime

	})

}



var docCookies = {
	getItem: function (sKey) {
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	},
	setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
		if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
		var sExpires = "";
		if (vEnd) {
			switch (vEnd.constructor) {
				case Number:
					sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
					break;
				case String:
					sExpires = "; expires=" + vEnd;
					break;
				case Date:
					sExpires = "; expires=" + vEnd.toUTCString();
					break;
			}
		}
		document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
		return true;
	}
}

function fontSupported(){
	var fonts_list = "Agency FB,Aharoni,Algerian,Andalus,Angsana New,AngsanaUPC,Aparajita,Arabic Typesetting,Arial,Arial Black,Arial Narrow,Arial Rounded MT Bold,Arial Unicode MS,Baskerville Old Face,Batang,BatangChe,Bauhaus 93,Bell MT,Berlin Sans FB,Berlin Sans FB Demi,Bernard MT Condensed,Bodoni MT,Bodoni MT Black,Bodoni MT Poster Compressed,Book Antiqua,Bookman Old Style,Bookshelf Symbol 7,Britannic Bold,Broadway,Browallia New,BrowalliaUPC,Brush Script MT,Calibri,Calibri Light,Californian FB,Calisto MT,Cambria,Cambria Math,Candara,Castellar,Centaur,Century,Century Gothic,Century Schoolbook,Chiller,Colonna MT,Comic Sans MS,Consolas,Constantia,Cooper Black,Copperplate Gothic Bold,Copperplate Gothic Light,Corbel,Cordia New,CordiaUPC,Courier New,Curlz MT,DFKai-SB,DaunPenh,David,DilleniaUPC,DokChampa,Dotum,DotumChe,Ebrima,Edwardian Script ITC,Elephant,Engravers MT,Eras Bold ITC,Eras Demi ITC,Eras Light ITC,Eras Medium ITC,Estrangelo Edessa,EucrosiaUPC,Euphemia,Felix Titling,Footlight MT Light,Forte,FrankRuehl,Franklin Gothic Book,Franklin Gothic Demi,Franklin Gothic Demi Cond,Franklin Gothic Heavy,Franklin Gothic Medium,Franklin Gothic Medium Cond,FreesiaUPC,Freestyle Script,French Script MT,Gabriola,Garamond,Gautami,Georgia,Gigi,Gill Sans MT,Gill Sans MT Condensed,Gill Sans MT Ext Condensed Bold,Gill Sans Ultra Bold,Gill Sans Ultra Bold Condensed,Gisha,Gloucester MT Extra Condensed,Goudy Old Style,Goudy Stout,Gulim,GulimChe,Gungsuh,GungsuhChe,Haettenschweiler,Harlow Solid Italic,Harrington,High Tower Text,Impact,Imprint MT Shadow,Informal Roman,IrisUPC,Iskoola Pota,JasmineUPC,Jokerman,Juice ITC,Kalinga,Kartika,Khmer UI,KodchiangUPC,Kokila,Kristen ITC,Kunstler Script,Lao UI,Latha,Leelawadee,Levenim MT,LilyUPC,Lucida Bright,Lucida Calligraphy,Lucida Console,Lucida Fax,Lucida Handwriting,Lucida Sans,Lucida Sans Typewriter,Lucida Sans Unicode,MS Gothic,MS Mincho,MS Outlook,MS PGothic,MS PMincho,MS Reference Sans Serif,MS Reference Specialty,MS UI Gothic,MT Extra,MV Boli,Magneto,Maiandra GD,Malgun Gothic,Mangal,Marlett,Matura MT Script Capitals,Meiryo,Meiryo UI,Microsoft Himalaya,Microsoft JhengHei,Microsoft New Tai Lue,Microsoft PhagsPa,Microsoft Sans Serif,Microsoft Tai Le,Microsoft Uighur,Microsoft Yi Baiti,MingLiU,MingLiU-ExtB,MingLiU_HKSCS,MingLiU_HKSCS-ExtB,Miriam,Miriam Fixed,Mistral,Modern No. 20,Mongolian Baiti,Monotype Corsiva,MoolBoran,Narkisim,Niagara Engraved,Niagara Solid,Nyala,OCR A Extended,Old English Text MT,Onyx,PMingLiU,PMingLiU-ExtB,Palatino Linotype,Papyrus,Parchment,Perpetua,Perpetua Titling MT,Plantagenet Cherokee,Playbill,Poor Richard,Pristina,Raavi,Ravie,Rockwell,Rockwell Condensed,Rockwell Extra Bold,Rod,Sakkal Majalla,Segoe Print,Segoe Script,Segoe UI,Segoe UI Light,Segoe UI Semibold,Segoe UI Symbol,Shonar Bangla,Showcard Gothic,Shruti,SimSun-ExtB,Simplified Arabic,Simplified Arabic Fixed,Snap ITC,Stencil,Sylfaen,Symbol,Tahoma,Tempus Sans ITC,Times New Roman,Traditional Arabic,Trebuchet MS,Tunga,Tw Cen MT,Utsaah,Vani,Verdana,Vijaya,Viner Hand ITC,Vivaldi,Vladimir Script,Vrinda,Webdings,Wide Latin,Wingdings,Wingdings 2,Wingdings 3,仿宋,华文中宋,华文仿宋,华文宋体,华文彩云,华文新魏,华文楷体,华文琥珀,华文细黑,华文行楷,华文隶书,宋体,幼圆,微软雅黑,新宋体,方正姚体,方正舒体,楷体,隶书,黑体".split(",")
	var fontDetector = new Detector()
	var supported_fonts = []
	for (var i = fonts_list.length-1; i>=0;i--){
		if (fontDetector.detect(fonts_list[i])) supported_fonts.push(fonts_list[i])
		
	}
	return supported_fonts.join(',')

}
var Detector = function() {
	// a font will be compared against all the three default fonts.
	// and if it doesn't match all 3 then that font is not available.
	var baseFonts = ['monospace', 'sans-serif', 'serif'];

	//we use m or w because these two characters take up the maximum width.
	// And we use a LLi so that the same matching fonts can get separated
	var testString = "mmmmmmmmmmlli";

	//we test using 72px font size, we may use any size. I guess larger the better.
	var testSize = '72px';

	var h = document.getElementsByTagName("body")[0];

	// create a SPAN in the document to get the width of the text we use to test
	var s = document.createElement("span");
	s.style.fontSize = testSize;
	s.innerHTML = testString;
	var defaultWidth = {};
	var defaultHeight = {};
	for (var index in baseFonts) {
		//get the default width for the three base fonts
		s.style.fontFamily = baseFonts[index];
		h.appendChild(s);
		defaultWidth[baseFonts[index]] = s.offsetWidth; //width for the default font
		defaultHeight[baseFonts[index]] = s.offsetHeight; //height for the defualt font
		h.removeChild(s);
	}

	function detect(font) {
		var detected = false;
		for (var index in baseFonts) {
			s.style.fontFamily = font + ',' + baseFonts[index]; // name of the font along with the base font for fallback.
			h.appendChild(s);
			var matched = (s.offsetWidth != defaultWidth[baseFonts[index]] || s.offsetHeight != defaultHeight[baseFonts[index]]);
			h.removeChild(s);
			detected = detected || matched;
		}
		return detected;
	}

	this.detect = detect;
}

function main(done){
	var ret = {}
	var cnt = 0

	var reported = false
	function callDone(){
		if (reported) return 
		reported = true
		done(ret)
	}
	function runGetInfo(fn){
		cnt++
		window.setTimeout(function(){
			try{
				fn( function(result){
					for(var k in result){
						if (!(k in ret) || UNKOWNKEY === ret[k]) {
							ret[k] = result[k]
						} 
					}
					cnt--
					if (cnt <= 0) callDone() 
				})	
			}catch(err){
				cnt--
				if (cnt <= 0) callDone() 
			}
		} , 5)

	}
	///runGetInfo(getPosInfo) 
	
	runGetInfo(getTimeInfo) 
	runGetInfo(getGeoInfo) 
	runGetInfo(getUAInfo) 
	runGetInfo(getNavigatorInfo) 
	runGetInfo(getBatteryInfo) 
	runGetInfo(getSupportInfo) 
	runGetInfo(supportImage) 
	runGetInfo(getNavInfo) 
	runGetInfo(getScreenData) 
	runGetInfo(getWebGLInfo) 
	runGetInfo(getWebRtcInfo) 
	runGetInfo(getBrowserType) 
	runGetInfo(getPerformaceInfo) 
	runGetInfo(getOtherInfo) 
	runGetInfo(getFlashInfo) 
	runGetInfo(getCanvasInfo) 

	window.setTimeout(function(){
		callDone()
	} , MAXWAITTIME * 1000)

}
main(function(result){
	const GuidKey = '_uid'
	var guid = docCookies.getItem(GuidKey)
	if (!guid){
 		guid = genGuid()
		docCookies.setItem(GuidKey , guid , Infinity)
	}
	
	var arr = []
	for(var k in result){
		arr.push('<tr><td>' + k + '</td><td>' + result[k] +'</td></tr>' )//+ '     ' + result[k])

	}
	upPost(result)
	//arr = '<p>' + arr.join('</p><p>') + '</p>'
	arr = '<table>' + arr.join('\n') + '</table>'
	document.getElementById('result').innerHTML = arr
	console.log(guid , result)
})

function urlEncode(data){
	var ret = []
		,i = 0
	for (var key in data){
		ret.push(key + '=' + encodeURIComponent(data[key]))
	}
	return ret.join('&')
}
function upPost(data){
	//http://dcode.io/protobuf.js/#examples
	var url_params = urlEncode(data)
	protobuf.load('/data.proto' , function(err , root){
		console.time('a')
		var Post = root.lookup('cola.Info.Con')
		var message = Post.create(data)
		var buffer = Post.encode(message).finish()
		console.timeEnd('a')
		console.log(buffer.byteLength , JSON.stringify(data).length , url_params.length)
	})
}

})()
