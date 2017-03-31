## 关于配置
默认会调用框架下的默认配置 可以通过启动服务时传入configPath参数指定自己的config目录
>>> hornbill.start({
>>>     'appsPath' : path.resolve(__dirname , '../apps')
>>>     ,'configPath' : path.resolve(__dirname,'config')
>>> })


hornbill的配置内容较多 采用配置文件的方式
virtual_host.json 配置虚拟空间，根据域名指定项目目录 
>>> {"abc.com" :"demo"}
当访问域名为abc.com时 访问apps下demo项目

etc.json
·
{"uploadTmp":false,
"watchingTpl":true,//自动热更新，开发模式为true ,线上应改为false
"fussTpl":false, //是否混淆模版
"hostID":"0.0.0.0", //输出服务头时表明自己是哪台服务器
"token":"abcd", //ajax加解密密钥
"hostDefault":{
    "demo":"welcome" //请求网站根目录时的controller
},
"compiler" : true , //是否开启静态编译
"loadDepency" : false, //内置的combo.js使用这个参数，为true时会加载全部依赖，默认为false
"compile" : {
    ".js" : {"compiler" : "combo.js" ,"contentType" : "application/x-javascript"} //静态文件编译器
    ,".css" : {"contentType" : "text/css" }
    ,".svg" : {"contentType" : "image/svg+xml" }
},
"onPort":6001 //服务占用端口
}
·