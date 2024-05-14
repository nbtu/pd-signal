const $=require('./includes');
const path=require('path');
const fs=require('fs');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname,'dd-signal.db'), { verbose: console.log });
let tables=['vtbs','watch','list'];
for(let table of tables){
    let result=db.prepare('SELECT count(*) as exist FROM sqlite_master WHERE type=\'table\' AND name = ?').get(table);
    if(!result.exist){
        db.exec(fs.readFileSync(path.join(__dirname,'sql/'+table+'.sql'),'utf8'));
    }
}

module.exports={
    addVtbToWatch(chatid,mid,username,usernick,liveStatus,title,platform,hls){
        const vtb=this.getVtbByMid(mid);
        if(!vtb) {
            db.prepare('insert into vtbs (mid,username,usernick,liveStatus,title,platform,hls) values' +
                '(?,?,?,?,?,?,?)').run(mid,username,usernick,liveStatus,title,platform,hls);
            $.emitter.emit('updateVtbs');
        }
        db.prepare('insert into watch (chatid,mid) values(?,?)').run(chatid,mid);
    },
    getVtbByMid(mid){
        return db.prepare('select * from vtbs where mid=?').get(mid);
    },
    getWatchByChatid(chatid){
        return db.prepare('select w.*,v.* from watch w inner join vtbs v on w.mid=v.mid where w.chatid=?').all(chatid);
    },
    existsWatch(chatid,mid){
        return db.prepare('select rowid from watch where chatid=? and mid=?').get(chatid,mid)?true:false;
    },
    delWatch(chatid,mid){
        db.prepare('delete from watch where chatid=? and mid=?').run(chatid,mid);
        let other=db.prepare('select * from watch where mid=?').get(mid);
        if(!other){
            db.prepare('delete from vtbs where mid=?').run(mid);
            $.emitter.emit('updateVtbs');
        }
    },
    getVtbByUsername(username){
        return db.prepare('select * from vtbs where username=?').get(username);
    },
    getVtbs(){
        return db.prepare('select * from vtbs').all();
    },
    updateVtbColumn(column,value,mid){
        db.prepare('update vtbs set '+column+'=? where mid=?').run(value,mid);
    },
    getWatchByMid(mid){
        return db.prepare('select * from watch where mid=?').all(mid);
    },
    //黑白名单管理
    addList(tgid,status){
        //const checkid=this.getListBytgid(tgid);
        //if(!checkid) {
            db.prepare('insert into list (tgid,status) values' + '(?,?)').run(tgid,status);
        //    $.emitter.emit('updateLists');
        //}
    },
    
 
    getLists(){
        return db.prepare('select * from list').all();
    },
    getListBytgid(tgid){
        return db.prepare('select * from list where tgid=?').get(tgid);
    },
    getListBystatus(status) {
        const rows = db.prepare('select tgid from list where status=?').all(status);
        const tgids = rows.map(row => row.tgid);
        return tgids;
    },
    
    existsList(tgid){
        return db.prepare('select rowid from list where tgid=?').get(tgid)?true:false;
    },
    
    delList(tgid,status){
        db.prepare('delete from list where tgid=? and status=?').run(tgid,status);
        let other=db.prepare('select * from list where tgid=?').get(status);
        if(!other){
            db.prepare('delete from list where tgid=?').run(tgid);
            $.emitter.emit('updateLists');
        }
    }
    
};