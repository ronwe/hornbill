# hornbill
基于uri的 node mvc框架，适用于前后端分离服务

启动服务脚本放置在nest下 主要放置启动文件 配置文件
var hornbill = require('../frame')
    ,path = require('path')

hornbill.start({
    'appsPath' : path.resolve(__dirname , '../apps') //设置应用主目录
    ,'configPath' : path.resolve(__dirname,'config') //设置配置主目录，扩展框架内置配置
})


默认端口6001  

### 2017.3.31
模版引擎支持将静态文件直接输出到页面
语法： <% IncludeStatic('demo.js') %>
页面源码会显示为 
>>> <script type="text/javascript"> 
>>>  demo.js的代码 ，注： 这里的js内容会被指定编译器处理，但不会经过中间件处理
>>> </script>

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
