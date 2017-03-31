# hornbill
基于uri的 node mvc框架，适用于前后端分离服务

启动服务脚本放置在nest下 主要放置启动文件 配置文件

	var hornbill = require('../frame')
     ,path = require('path')

	hornbill.start({
		'appsPath' : path.resolve(__dirname , '../apps') //设置应用主目录
		,'configPath' : path.resolve(__dirname,'config') //设置配置主目录，扩展框架内置配置
	})

服务配置见 [配置.md](配置.md)
默认端口6001 

### 2017.4.1
静态脚本支持合并输出
比如 http://127.0.0.1:6001/demo,js/jquery.js
文件用,逗号分割 只在最后带文件后缀名
注意：文件打印顺序取决于文件读取速度，和url上的顺序无关

### 2017.3.31
模版引擎支持将静态文件直接输出到页面
语法： <% IncludeStatic('demo.js') %>
页面源码会显示为 
>>> <script type="text/javascript"> 
>>>  demo.js的代码 ，注： 这里的js内容会被指定编译器处理，但不会经过中间件处理
>>> </script>

服务启动参数增加staticCompilerPath，指定静态文件编译器路径，默认系统带combo模块用以支持模块化包装

>>> hornbill.start({
>>>    'appsPath' : path.resolve(__dirname , '../apps')
>>>    ,'configPath' : path.resolve(__dirname,'config')
>>>    ,'staticCompilerPath' : path.resolve(__dirname,'compiler')
>>> })

### 2017.3.30
模版引擎支持远程include 
语法： <%! 远程uri %>

### 2017.3.21
启动入口支持中间件注册
> hornbill.use(x , {
>  urlRegTest:'/' ,  //* 对request.url进行正则匹配
>  host: 'demo', //* 对virtual_host 进行匹配
>  after: true    //默认为false 即发生在apps处理之前
> })

### 2016.5.7  
提供js模块加载功能(commonjs)
