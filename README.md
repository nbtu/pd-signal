# pd-signal
监控多个pandalive主播的直播状态，并发送开播、下播提醒消息的Telegram Bot。  

根据此项目修改而来 https://github.com/juzeon/dd-signal ，使用安装请前往查看原项目  

修改监控网站   
移除vdb虚拟主播列表   
增加黑白名单限制Bot的使用，默认whitelist/blacklist为空，所有人都可以使用bot，在index.js文件顶部添加黑白名单。   

v2    
增加一个用户数据表，用于存放黑白名单    
增加一个--pass(默认为kbjba)启动参数，用户使用管理命令    
>    命令列表：
>     
>     /admin <pass> - 显示本消息。
>     /whitelist <pass> <tgid> - 添加白名单。
>     /blacklist <pass> <tgid> - 添加黑名单。
>     /delwhitelist <pass> <tgid> - 删除白名单。
>     /delblacklist <pass> <tgid>- 删除黑名单。
>     /userlist <pass> - 显示黑白名单。
>     默认是所有用户都可以使用，当白名单不为空是启用白名单。
  
记录：     
添加监控主播到关注列表，程序开始循环检测开播状态。    
当前方法是循环检测主播页面信息，只监控不仅直播间抓取直播源，不需要登录账号。    
观看直播使用[5721004.xyz](https://5721004.xyz/)提供的页面，特殊房间也不一定能看到。    
当添加新主播后会刷新关注列表，新主播会在下一轮循环才加入检测。    
pandalive API限制较为严格，请求过快可能会导致封IP(一般封有一天)，适当加大间隔时间。    

todo    
有账号使用Cookie登录可以改进监控方法，也可以增加抓源功能。    
增加命令添加黑白名单     
