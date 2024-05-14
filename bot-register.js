const $ = require('./includes');
const stripIndent = require('strip-indent');
const dbm = require('./dbm');

module.exports = function(whitelist, blacklist) {
    return function() {
        
    function authorize(userId, whitelist, blacklist) {
            // 如果白名单不为空，只有白名单中的用户可以使用bot
            if (whitelist.length > 0) {
                return whitelist.includes(userId);
            }
            // 如果黑名单不为空，除了黑名单中的用户，其他人都可以使用bot
            if (blacklist.length > 0) {
                return !blacklist.includes(userId);
            }
            // 默认情况下，所有人都可以使用bot
            return true;
    }       
    
    $.bot.onText(/\/start/, (msg) => {
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot，输入 /id 查询你的id。');
            return;
        }
        $.bot.sendMessage(msg.chat.id, '嗨，'
            + $.parseTgUserNickname(msg.from)
            + '\n您可以输入 /help 查看命令帮助。', $.defTgMsgForm);
    });
    $.bot.onText(/\/help/, msg => {
        $.bot.sendMessage(msg.chat.id, stripIndent(`
    命令列表：
    
    /start - 启用机器人。
    /add \`<用户ID>\` - 添加新主播至监控列表。
    /del \`<用户ID>\` - 输入后，在弹出的键盘中选择需要删除的主播。
    /list - 查看您的监控列表。
    /help - 显示帮助。
    🎥-->放录像|🔒-->密码房|🔞-->限制房|💰-->粉丝房。
    `), $.defTgMsgForm);
    });
    
    $.bot.onText(/\/id/, msg => {
        $.bot.sendMessage(msg.chat.id, '您的 Telegram ID 是：' + msg.from.id );
    });
    
    $.bot.on('text',msg=>{

        if(msg.text.toString().startsWith('❌  ')){
            let username=msg.text.toString().slice(3).trim();
            let vtb=dbm.getVtbByUsername(username);
            if(!vtb){
                $.bot.sendMessage(msg.chat.id,'不存在主播 `'+username+'`',$.defTgMsgForm);
                return;
            }
            if(!dbm.existsWatch(msg.chat.id,vtb.mid)){
                $.bot.sendMessage(msg.chat.id,'该主播不在您的监控列表中。',$.defTgMsgForm);
                return;
            }
            dbm.delWatch(msg.chat.id,vtb.mid);
            $.bot.sendMessage(msg.chat.id,'已删除主播 `'+vtb.username+'`。',$.defTgMsgForm);
        }else if(msg.text.toString()=='取消'){
            $.bot.sendMessage(msg.chat.id,'取消当前操作。',$.defTgMsgForm);
        }else if(msg.text.toString().startsWith('❤️  ')){
            let username=msg.text.toString().slice(3).trim();
            let vtbList=$.vtbList.filter(vtb=>vtb.username==username);
            if(!vtbList.length){
                $.bot.sendMessage(msg.chat.id,'不存在主播 `'+username+'`',$.defTgMsgForm);
                return;
            }
            _addWatchByMid(msg,vtbList[0].mid);
        }//else{
//            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot.');
//            return;
//        }
    });
    $.bot.onText(/\/search (.+)/,(msg,match)=>{
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot。');
            return;
        }
        let searchText=match[1].toString().trim().toLowerCase();
        let arr=$.vtbList.filter(vtb=>vtb.username.toLowerCase().includes(searchText));
        if(!arr.length){
            $.bot.sendMessage(msg.chat.id,'未找到符合搜索关键词的Vtubers。',$.defTgMsgForm);
            return;
        }
        arr=arr.map(vtb=>"❤️  "+vtb.username);
        arr.push('取消');
        let keyboard=$.formatTgKeyboard(arr);
        $.bot.sendMessage(msg.chat.id,'已为您搜索到'+(arr.length-1)+'个Vtubers。\n请在弹出的键盘中选择需要添加的主播。',{
            reply_markup:{
                keyboard:keyboard
            }
        });
    });
    $.bot.onText(/^\/del$/,msg=>{
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot。');
            return;
        }
        let watches=dbm.getWatchByChatid(msg.chat.id);
        if(!watches.length){
            $.bot.sendMessage(msg.chat.id,'您的监控列表为空。',$.defTgMsgForm);
            return;
        }
        let plainWatchArr=watches.map(item=>'❌  '+item.username);
        plainWatchArr.push('取消');
        let keyboard=$.formatTgKeyboard(plainWatchArr);

        $.bot.sendMessage(msg.chat.id,'请在弹出的键盘中选择需要删除的主播。',{
            reply_markup:{
                keyboard:keyboard
            }
        });
    });
    $.bot.onText(/\/del (.+)/,(msg,match)=>{
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot。');
            return;
        }
        let mid=match[1].toString().trim();
        if(!$.isInt(mid)){
            $.bot.sendMessage(msg.chat.id,'请输入正确的ID。',$.defTgMsgForm);
            return;
        }
        if(!dbm.existsWatch(msg.chat.id,mid)){
            $.bot.sendMessage(msg.chat.id,'该主播不在您的监控列表中。',$.defTgMsgForm);
            return;
        }
        let vtb=dbm.getVtbByMid(mid);
        dbm.delWatch(msg.chat.id,mid);
        $.bot.sendMessage(msg.chat.id,'已删除主播 `'+vtb.username+'`。',$.defTgMsgForm);
    });
    $.bot.onText(/\/list/,msg=>{
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot。');
            return;
        }
        let watchArr=dbm.getWatchByChatid(msg.chat.id);
        let message='您的监控列表：\n\n';
        message+=$.formatWatchMessagePartial(watchArr);
        $.bot.sendMessage(msg.chat.id,message,$.defTgMsgForm);
    });
    $.bot.onText(/\/add (.+)/, async (msg,match) => {
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot。');
            return;
        }
        let mid=match[1].toString().trim();
        $.bot.sendMessage(msg.chat.id,mid,$.defTgMsgForm);
        _addWatchByMid(msg,mid);
    });
    };
}
function _addWatchByMid(msg,mid){
    if(dbm.existsWatch(msg.chat.id,mid)){
        $.bot.sendMessage(msg.chat.id,'该主播已在您的监控列表中。',$.defTgMsgForm);
        return;
    }
    
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('userId', mid);
    formData.append('info', 'media');

    const axiosConfig = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'x-device-info': '{"t":"webPc","v":"1.0","ui":24631221}',
            ...formData.getHeaders() // 获取 FormData 的头信息
        }
    };

    $.axios.post('https://api.pandalive.co.kr/v1/member/bj', formData, axiosConfig)
    .then(response => {
        //console.log('Response:', response.data);
        // 检查响应以确定是否成功添加主播
        if (response.data.result) {
        // 主播添加成功
            dbm.addVtbToWatch(msg.chat.id, mid, mid, "", "", "","","");
            $.bot.sendMessage(msg.chat.id, '已添加主播 `' + mid + '`。', $.defTgMsgForm);
        } else {
        // 主播添加失败
            $.bot.sendMessage(msg.chat.id, '无法添加主播 `' + mid + '`。', $.defTgMsgForm);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        $.bot.sendMessage(msg.chat.id, $.template.networkError, $.defTgMsgForm);
    });
}    
 





