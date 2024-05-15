# pd-signal
监控多个pandalive主播的直播状态，并发送开播、下播提醒消息的Telegram Bot。  

根据此项目修改而来 https://github.com/juzeon/dd-signal ，使用安装请前往查看原项目  

修改监控网站   
移除vdb虚拟主播列表   
增加黑白名单限制Bot的使用，默认whitelist/blacklist为空，所有人都可以使用bot，在index.js文件顶部添加黑白名单。   

记录：      
添加监控主播到关注列表，程序开始循环检测开播状态。    
当前方法是循环检测主播页面信息，只监控不仅直播间抓取直播源，不需要登录账号。    
观看直播使用[5721004.xyz](https://5721004.xyz/)提供的页面，特殊房间也不一定能看到。    
当添加新主播后会刷新关注列表，新主播会在下一轮循环才加入检测。    
pandalive API限制较为严格，请求过快可能会导致封IP(一般封有一天)，适当加大间隔时间。

使用感受：  
我设置检测的隔间为20秒，运行半天IP被封了。    
同时间隔大，检测数量多时，检测一轮耗时很久。     
例如监控30个主播，间隔20秒，全部检测一次至少需要10多分钟，而且20秒还不是一个安全值。    

todo    
有账号使用Cookie登录可以改进监控方法，也可以增加抓源功能。     
√增加命令添加黑白名单      

已完成自用版      
改进使用Cookie登录，一次获取能100个主播信息，大大地减少的请求数量，避免IP被封。    
获取到数据后查询主播也变成在本地进行，循环间隔可以任意设置小数值，加快检测推送。    
