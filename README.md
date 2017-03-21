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

### 2016.5.7  
提供js模块加载功能(commonjs)

### 2017.3.21
启动入口支持中间件注册
> hornbill.use(x , {
>  urlRegTest:'/' ,  //* 对request.url进行正则匹配
>  host: 'demo', //* 对virtual_host 进行匹配
>  after: true    //默认为false 即发生在apps处理之前
> })
