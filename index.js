//默认whitelist/blacklist为空，所有人都可以使用bot
//使用格式例子 const whitelist = [123,456];
const whitelist = [];
const blacklist = [];

const args = require('minimist')(process.argv.slice(2));
const urlParse = require('url-parse');
const fs=require('fs');
const path=require('path');
const nodeGlobalProxy = require("node-global-proxy").default;
const $ = require('./includes');
const botRegister = require('./bot-register')(whitelist, blacklist);
const dbm = require('./dbm');
const FormData = require('form-data');



const helpText = `
参数：
  --interval <IntervalBySec> - 可选，每次访问B站API间隔的秒数，默认为10
  --token <TelegramBotToken> - 必选，Telegram Bot Token
  --proxy <HTTPProxy> - 可选，以 http:// 开头的代理
`;
const interval = args.interval ? args.interval : 10;
if (!$.isInt(interval)) {
    console.log(helpText);
    process.exit(-1);
}
const token = args.token;
if (!token) {
    console.log(helpText);
    process.exit(-1);
}
$.bot.token = token;
const proxy = args.proxy;
if (proxy) {
    let proxyUrlObj = urlParse(proxy, true);
    if (proxyUrlObj.protocol != 'http:') {
        console.log('--proxy 只支持HTTP PROXY');
        process.exit(-1);
    }
    nodeGlobalProxy.setConfig(proxy);
    nodeGlobalProxy.start();
    // $.bot.options.request = {
    //     proxy: proxy
    // };
    // $.axios.defaults.proxy = {
    //     host: proxyUrlObj.hostname,
    //     port: proxyUrlObj.port
    // };

}
botRegister();
$.bot.startPolling();
let vtbs = dbm.getVtbs();
$.emitter.on('updateVtbs', () => {
    vtbs=dbm.getVtbs();
    console.log('Reloaded Vtbs.');
});
console.log('dd-signal 已启动！');
async function notifySubscriberChats(vtb){
    console.log('Let\'s notify subscribers about '+vtb.mid);
    let head;
    if (vtb.liveStatus !== null && vtb.liveStatus !== undefined) {
        head='`'+vtb.mid+'` '+(vtb.liveStatus?'开播啦！\n开播时间：'+vtb.liveStatus :'下播了。')+'\n\n';
    } else {
        console.error('vtb.liveStatus 不存在或为 null/undefined');
    }
    
    let watches=dbm.getWatchByMid(vtb.mid);
    for(let [index,watch] of watches.entries()){
        console.log(watch.chatid);
        let body=$.formatWatchMessagePartial(dbm.getWatchByChatid(watch.chatid));
        await $.bot.sendMessage(watch.chatid,head+body,$.defTgMsgForm);
        if(index%20==0 && index!=0){
            await $.sleep(1000);
        }
    }
}

(async function rotate() {
    for (let vtb of vtbs) {
        console.log('Checking ' + vtb.mid);
        try {
            const formData = new FormData();
            formData.append('userId', vtb.mid); // 使用 vtb.mid 而不是未定义的 mid
            formData.append('info', 'media fanGrade');

            const axiosConfig = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
                    'x-device-info': '{"t":"webPc","v":"1.0","ui":24631221}',
                    ...formData.getHeaders()
                }
            };

            const response = await $.axios.post('https://api.pandalive.co.kr/v1/member/bj', formData, axiosConfig);

            if (response.data.result) {
                // 处理成功响应
                const mediaData = response.data.media;
                const startTime = mediaData && mediaData.startTime ? mediaData.startTime : "";
                const otitle = mediaData && mediaData.title ? mediaData.title : ""; 
                const userNick = mediaData && mediaData.userNick ? mediaData.userNick : ""; 
                
                const liveType = mediaData && mediaData.liveType ? (mediaData.liveType === "rec" ? "🎥|" : "") : "";
                const isPw = mediaData && mediaData.isPw ? (mediaData.isPw === true ? "🔒|" : mediaData.isPw) : "";
                const isAdult = mediaData && mediaData.isAdult ? (mediaData.isAdult === true ? "🔞|" : "") : "";
                const type = mediaData && mediaData.type ? (mediaData.type === "fan" ? "💰|" : "") : "";
                const title = isAdult+isPw+type+otitle;

                if(userNick!=vtb.usernick){
                    dbm.updateVtbColumn('usernick',userNick,vtb.mid);
                    vtb.usernick=userNick;
                }
                if(title!=vtb.title){
                    dbm.updateVtbColumn('title',title,vtb.mid);
                    vtb.title=title;
                }

                if(startTime!=vtb.liveStatus){
                    dbm.updateVtbColumn('liveStatus',startTime,vtb.mid);
                    vtb.liveStatus=startTime;
                    notifySubscriberChats(vtb);
                }

                console.log('OK! Waiting ' + interval + 's to next checking. ');
            } else {
                console.error('Error: ' + response.status);
                if (err.response.data) {
                    console.error('Error Message: ' + JSON.stringify(err.response.data));
                    startTime = "";
                    if(startTime!=vtb.liveStatus){
                        dbm.updateVtbColumn('liveStatus',startTime,vtb.mid);
                        vtb.liveStatus=startTime;
                        notifySubscriberChats(vtb);
                    }
                    continue;
                }
                // 处理 400 错误
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }
    }
    // 其他逻辑
    setImmediate(rotate);
})();
