const $ = require('./includes');
const stripIndent = require('strip-indent');
const dbm = require('./dbm');

module.exports = function(whitelist, blacklist, pass) {
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
    //console.log(pass)
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
    /id - 查看您的Telegram ID。
    /admin <pass> - 管理黑白名单。
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
        }
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
        if(!mid){
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
    
    /////////////////////////////////////
    $.bot.onText(/^\/admin$/, msg => {
        $.bot.sendMessage(msg.chat.id, '请输入 /admin <pass> 以查看命令列表。', $.defTgMsgForm);
    });
    $.bot.onText(/\/admin (.+)/, msg => {
        const token = msg.text.split(' ')[1].trim(); // 获取密码部分
        // 检查 token 是否匹配预定义的密码
        if (token === pass) {
            $.bot.sendMessage(msg.chat.id, stripIndent(`
    命令列表：
    
    /admin <pass> - 显示本消息。
    /whitelist <pass> <tgid> - 添加白名单。
    /blacklist <pass> <tgid> - 添加黑名单。
    /delwhitelist <pass> <tgid> - 删除白名单。
    /delblacklist <pass> <tgid>- 删除黑名单。
    /userlist <pass> - 显示黑白名单。
    默认是所有用户都可以使用，当白名单不为空是启用白名单。
            `), $.defTgMsgForm);
        } else {
        // 如果密码不匹配，发送错误消息
            $.bot.sendMessage(msg.chat.id, '密码错误，请重试。', $.defTgMsgForm);
        }
    });
    
    $.bot.onText(/^\/delwhitelist$/, msg => {
        $.bot.sendMessage(msg.chat.id, '请输入 /delwhitelist <pass> <tgid> 删除白名单用户。', $.defTgMsgForm);
    });
    $.bot.onText(/\/delwhitelist\s+(.+)\s+(-?\d+)/,(msg,match)=>{
        const token = match[1].trim();
        // 检查 pass 是否匹配预定义的密码
        if (token === pass) {
            
            let userId = parseInt(match[2]);
            //console.log(userId);
            if (!Number.isInteger(userId)) {
                $.bot.sendMessage(msg.chat.id,'请输入正确的ID。',$.defTgMsgForm);
                return;
            }
            //console.log(dbm.existsList(userId));
            if(!dbm.existsList(userId)){
                $.bot.sendMessage(msg.chat.id,'该用户不白名单列表中。',$.defTgMsgForm);
                return;
            }
            dbm.delList(userId, "whitelist");
            whitelist=dbm.getListBystatus("whitelist");
            $.bot.sendMessage(msg.chat.id,'已删除白名单用户 `'+userId+'`。',$.defTgMsgForm);
        } else {
            // 如果密码不匹配，发送错误消息
            $.bot.sendMessage(msg.chat.id, '密码错误，请重试。', $.defTgMsgForm);
        }
    });
    
    $.bot.onText(/^\/delblacklist$/, msg => {
        $.bot.sendMessage(msg.chat.id, '请输入 /delblacklist <pass> <tgid> 删除黑名单用户。', $.defTgMsgForm);
    });
    $.bot.onText(/\/delblacklist\s+(.+)\s+(-?\d+)/,(msg,match)=>{
        const token = match[1].trim();
        // 检查 pass 是否匹配预定义的密码
        if (token === pass) {
            let userId = parseInt(match[2]);
            if (!Number.isInteger(userId)) {
                $.bot.sendMessage(msg.chat.id,'请输入正确的ID。',$.defTgMsgForm);
                return;
            }
            if(!dbm.existsList(userId)){
                $.bot.sendMessage(msg.chat.id,'该用户不黑名单列表中。',$.defTgMsgForm);
                return;
            }
            dbm.delList(userId, "blacklist");
            blacklist=dbm.getListBystatus("blacklist");
            $.bot.sendMessage(msg.chat.id,'已删除黑名单用户 `'+userId+'`。',$.defTgMsgForm);
        } else {
            // 如果密码不匹配，发送错误消息
            $.bot.sendMessage(msg.chat.id, '密码错误，请重试。', $.defTgMsgForm);
        }
    });

    $.bot.onText(/^\/whitelist$/, msg => {
        $.bot.sendMessage(msg.chat.id, '请输入 /whitelist <pass> <tgid> 添加白名单用户。', $.defTgMsgForm);
    });
    $.bot.onText(/\/whitelist\s+(.+)\s+(-?\d+)/, (msg, match) => {
        const token = match[1].trim();
        // 检查 pass 是否匹配预定义的密码
        if (token === pass) {
            let userId = parseInt(match[2]);
            if (!Number.isInteger(userId)) {
                $.bot.sendMessage(msg.chat.id,'请输入正确的ID。',$.defTgMsgForm);
                return;
            }

            if(dbm.existsList(userId)){
                $.bot.sendMessage(msg.chat.id,'该TG已在名单中，状态' + dbm.getListBytgid(userId).status + '，要修改请先删除。',$.defTgMsgForm);
                return;
            }
            dbm.addList(userId, "whitelist");
            whitelist=dbm.getListBystatus("whitelist");
            $.bot.sendMessage(msg.chat.id, '已添加用户 `' + userId + '`到白名单。', $.defTgMsgForm);
        } else {
        // 如果密码不匹配，发送错误消息
        $.bot.sendMessage(msg.chat.id, '密码错误，请重试。', $.defTgMsgForm);
        }
    });
    
    $.bot.onText(/^\/blacklist$/, msg => {
        $.bot.sendMessage(msg.chat.id, '请输入 /blacklist <pass> <tgid> 添加黑名单用户。', $.defTgMsgForm);
    });
    $.bot.onText(/\/blacklist\s+(.+)\s+(-?\d+)/, (msg, match) => {
        const token = match[1].trim();
        // 检查 pass 是否匹配预定义的密码
        if (token === pass) {
            let userId = parseInt(match[2]);
            if (!Number.isInteger(userId)) {
                $.bot.sendMessage(msg.chat.id,'请输入正确的ID。',$.defTgMsgForm);
                return;
            }
            if(dbm.existsList(userId)){
                $.bot.sendMessage(msg.chat.id,'该TG已在名单中，状态' + dbm.getListBytgid(userId).status + '，要修改请先删除。',$.defTgMsgForm);
                return;
            }
            dbm.addList(userId, "blacklist");
            blacklist=dbm.getListBystatus("blacklist");
            $.bot.sendMessage(msg.chat.id, '已添加用户 `' + userId + '`到黑名单。', $.defTgMsgForm);
        } else {
            // 如果密码不匹配，发送错误消息
            $.bot.sendMessage(msg.chat.id, '密码错误，请重试。', $.defTgMsgForm);
        }
    });
    
    $.bot.onText(/^\/userlist$/, msg => {
        $.bot.sendMessage(msg.chat.id, '请输入 /userlist <pass> 以查看名单列表。', $.defTgMsgForm);
    });
    $.bot.onText(/\/userlist (.+)/, (msg, match) => {
        const token = match[1].trim();
        // 检查 pass 是否匹配预定义的密码
        if (token === pass) {
            $.bot.sendMessage(msg.chat.id, '白名单用户：' + whitelist + '\n\n黑名单用户：' + blacklist, $.defTgMsgForm);
        } else {
            // 如果密码不匹配，发送错误消息
            $.bot.sendMessage(msg.chat.id, '密码错误，请重试。', $.defTgMsgForm);
        }
    });
    
    $.bot.onText(/\/list/,msg=>{
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot。');
            return;
        }
        let watchArr=dbm.getWatchByChatid(msg.chat.id);
        let message='您的监控列表：\n\n';
        message+=$.listWatchMessagePartial(watchArr);
        $.bot.sendMessage(msg.chat.id,message,$.defTgMsgForm);
    });
    $.bot.onText(/\/add (.+)/, (msg,match) => {
        if (!authorize(msg.from.id, whitelist, blacklist)) {
            $.bot.sendMessage(msg.chat.id, '您未被授权使用此bot。');
            return;
        }
        let param=match[1].toString().trim();
        let mid;
        if(param){
            mid=param;
        }else{
            $.bot.sendMessage(msg.chat.id,'请输入正确的网址或ID。',$.defTgMsgForm);
            return;
        }
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
		params: {
			'userId': mid,
			'info': 'media'
		},
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'x-device-info': '{"t":"webPc","v":"1.0","ui":24631221}',
            ...formData.getHeaders() // 获取 FormData 的头信息
        }
    };

    $.axios.post('https://api.pandalive.co.kr/v1/member/bj', formData, axiosConfig)
    .then(response => {
        //console.log('Response:', response.data);
        // 检查响应以确定是否有此主播
        if (response.data.result) {
            // 添加主播
            let vtb = dbm.getVtbByMid(mid);
            //先检测数据库,没有就从请求获取数据，防止更新数据库更新其他人的推送
            if(!vtb){
                const mediaData = response.data.media;
                const startTime = mediaData && mediaData.startTime ? mediaData.startTime : "";
                const otitle = mediaData && mediaData.title ? mediaData.title : ""; 
                const userNick = mediaData && mediaData.userNick ? mediaData.userNick : ""; 
                
                const liveType = mediaData && mediaData.liveType ? (mediaData.liveType === "rec" ? "🎥|" : "") : "";
                const isPw = mediaData && mediaData.isPw ? (mediaData.isPw === true ? "🔒|" : "") : "";
                const isAdult = mediaData && mediaData.isAdult ? (mediaData.isAdult === true ? "🔞|" : "") : "";
                const type = mediaData && mediaData.type ? (mediaData.type === "fan" ? "💰|" : "") : "";
                const title = isAdult+isPw+type+otitle;
                
                dbm.addVtbToWatch(msg.chat.id, mid, mid, userNick, startTime, title,"panda","");
            }else{
                console.log(vtb);
                dbm.addVtbToWatch(msg.chat.id, mid, mid, vtb.usernick, vtb.liveStatus, vtb.title,"panda","");
            }
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