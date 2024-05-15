const axios=require('axios');
const TelegramBot = require('node-telegram-bot-api');
const EventEmitter = require('events');
const includes={
    isInt(value) {
        return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
    },
    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    },
    parseTgUserNickname(user){
        return ((user.first_name?user.first_name:'')
            +' '
            +(user.last_name?user.last_name:'')).toString().trim();
    },
    defTgMsgForm:{
        parse_mode:'Markdown',
        disable_web_page_preview:true,
        reply_markup:{
            remove_keyboard:true
        }
    },
    axios:axios.create({
        timeout:15000
    }),
    bot:new TelegramBot(),
    template:{
        networkError:'网络错误，请重试。'
    },
    formatWatchMessagePartial(arr){
        let str='';
        for(let vtb of arr){
            // 如果没有 liveStatus，则跳过当前的 VTB 条目
            if (!vtb.liveStatus) {
                continue;
            }
            // 将标题中的特殊字符替换为空字符串
            const cleanedTitle = vtb.title.replace(/[\[\].\-_()]/g, '');
            str+=vtb.liveStatus?'🟢  ':'🔴  ';
            str+='`'+vtb.username+'`';
            str+='(`'+vtb.usernick+'`)\n';
            str+=vtb.liveStatus?'  ['+cleanedTitle+'](https://5721004.xyz/player/pandalive.html?url='+vtb.mid+')\n':'';
            str+='\n';
        }
        return str;
    },
    listWatchMessagePartial(arr){
        let online = '';
        let offline = '';
        for(let vtb of arr){
            // 将标题中的特殊字符替换为空字符串
            const cleanedTitle = vtb.title.replace(/[\[\].\-_()]/g, '');
            const message = '`' + vtb.username + '`' + '(`' + vtb.usernick + '`)\n';
            const link = vtb.liveStatus ? ' [' + cleanedTitle + '](https://5721004.xyz/player/pandalive.html?url=' + vtb.mid + ')\n' : '';

            if(vtb.liveStatus) {
                online += '🟢  ' + message + link + '\n';
            } else {
                offline += '🔴  ' + message + link + '\n';
            }
        }
        // 合并在线和离线主播信息
        let str = online + offline;

        return str;
    },
    emitter:new EventEmitter(),
    formatTgKeyboard(arr){
        let keyboard=[];
        let step=0;
        for(let item of arr){
            if(step==0){
                keyboard.push([item]);
                step=1;
            }else{
                keyboard[keyboard.length-1].push(item);
                step=0;
            }
        }
        return keyboard;
    },
    vtbList:[]
};
module.exports=includes;