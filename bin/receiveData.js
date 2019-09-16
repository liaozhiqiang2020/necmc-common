var net = require('net');

var Stomp = require('./client2');
var destination = '/topic/myTopic';
var destination2 = '/topic/youTopic';
var heartbeatDest = '/queue/heartbeat.queue';
var register = '/queue/register.queue';
var client = new Stomp('127.0.0.1', 61613, 'user', 'pass');


var HOST = '172.18.216.34';//正式服
// var HOST = '172.24.127.99';//测试服
// var HOST = '192.168.137.1';
var PORT = 10917;

var p = 0;

var allBody;

var clientList = [];//保存多个客户端的数组
//-----------------------map-start--------------------------
function Map() {
    this.elements = new Array();

    //获取Map元素个数
    this.size = function () {
        return this.elements.length;
    },

        //判断Map是否为空
        this.isEmpty = function () {
            return (this.elements.length < 1);
        },

        //删除Map所有元素
        this.clear = function () {
            this.elements = new Array();
        },

        //向Map中增加元素（key, value)
        this.put = function (_key, _value) {
            if (this.containsKey(_key) == true) {
                if (this.containsValue(_value)) {
                    if (this.remove(_key) == true) {
                        this.elements.push({
                            key: _key,
                            value: _value
                        });
                    }
                } else {
                    this.elements.push({
                        key: _key,
                        value: _value
                    });
                }
            } else {
                this.elements.push({
                    key: _key,
                    value: _value
                });
            }
        },

        //删除指定key的元素，成功返回true，失败返回false
        this.remove = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        this.elements.splice(i, 1);
                        return true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        //获取指定key的元素值value，失败返回null
        this.get = function (_key) {
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        return this.elements[i].value;
                    }
                }
            } catch (e) {
                return null;
            }
        },

        //获取指定索引的元素（使用element.key，element.value获取key和value），失败返回null
        this.element = function (_index) {
            if (_index < 0 || _index >= this.elements.length) {
                return null;
            }
            return this.elements[_index];
        },

        //判断Map中是否含有指定key的元素
        this.containsKey = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        //判断Map中是否含有指定value的元素
        this.containsValue = function (_value) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].value == _value) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },

        //获取Map中所有key的数组（array）
        this.keys = function () {
            var arr = new Array();
            for (i = 0; i < this.elements.length; i++) {
                arr.push(this.elements[i].key);
            }
            return arr;
        },

        //获取Map中所有value的数组（array）
        this.values = function () {
            var arr = new Array();
            for (i = 0; i < this.elements.length; i++) {
                arr.push(this.elements[i].value);
            }
            return arr;
        };
}

//-----------------------map-end--------------------------

//-----------------------date-start----------------------
function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;
}

//-----------------------date-end------------------------

//-----------------------showClients-start--------------------------------
//显示所有在线的网关
function showClients() {
    console.log('【当前在线网关】：');
    for (var p = 0; p < clientList.length; p++) {

        if (clientList.length == 0) {
            console.log("无");
        } else {
            console.log(clientList[p].name);
        }
    }
}

//-------------------------showClients-end-----------------------------
var map = new Map();//key为网关连接信息，value为网关编号
var addressMap = new Map();//key为网关编号，value为网关连接信息
var status = "t";

//连接active'mq，监听端口，如果有消息发过来，就放入allBody'中
client.connect(function (sessionId) {

    client.subscribe(destination, function (body, headers) {
        console.log('From MQ:', body);
        allBody = body;

        var gatewaycode = allBody.split("_")[1];//获取网关sn
        // console.log(gatewaycode);
        var type2 = allBody.split("_")[0];//获取控制命令
        var type = type2.substring(6, 8);//获取数据包类型
        var chairId = type2.substring(8, 24);//获取按摩椅编号
        // console.log(chairId);
        var chairCodeAsc = new Buffer(chairId, "hex").toString("utf-8");//ascii椅子编号
        // console.log(chairCodeAsc);
        var endChair = new Buffer(type2, "hex");//转为ascii码

        var sockon = map.get(gatewaycode);  //根据网关编号获取当前网关连接
        // console.log(addressMap.get(sockon));
        try {
            if (type == "03") {
                sockon.write(endChair);
                console.log("修改端口：-----------");
                return allBody = "";
            }

            if (type == "04") {
                console.log(endChair);
                sockon.write(endChair);

                console.log("修改频道：-----------");
                return allBody = "";
            }

            if (type == "05") {
                // var controlMsg = type2.split("-")[0];
                sockon.write(endChair);
                console.log("重启网关：-----------");
                return allBody = "";
            }

            if (type == "09") {
                sockon.write(endChair);
                console.log("启动椅子：-----------");
                return allBody = "";

            }
            if (type == "10") {
                sockon.write(endChair);
                console.log("停止椅子：-----------");
                return allBody = "";

            }
            if (type == "13") {
                sockon.write(endChair);
                console.log("充电开：-----------");
                return allBody = "";

            }
            if (type == "14") {
                sockon.write(endChair);
                console.log("充电关：-----------");
                return allBody = "";

            }
            if (type == "15") {
                sockon.write(endChair);
                console.log("弱：-----------");
                return allBody = "";

            }
            if (type == "16") {
                sockon.write(endChair);
                console.log("中：-----------");
                return allBody = "";

            }
            if (type == "17") {
                sockon.write(endChair);
                console.log("强：-----------");
                return allBody = "";

            }
            if (type == "18") {
                sockon.write(endChair);
                console.log("暂停：-----------");
                return allBody = "";

            }
            if (type == "19") {
                sockon.write(endChair);
                console.log("继续：-----------");
                return allBody = "";

            }
            if (type == "08") {
                // debugger;
                sockon.write(endChair);
                console.log("查询椅子状态：-----------");
                return allBody = "";

            }

            if (type == "11") {
                sockon.write(endChair);
                console.log("修改椅子频道：-----------");
                return allBody = "";

            }

            if (type == "12") {
                sockon.write(endChair);
                console.log("修改椅子编号：-----------");
                return allBody = "";

            }

        } catch (e) {
            console.log("网关与设备通信异常222！！！！！");
            client.publish(destination2, "ff" + chairCodeAsc);//如果未响应，返回给web
            return allBody = "";
        }

    });


    client.subscribe("/queue/queue1", function (body, headers) {
        console.log('新网关注册步骤一+++++++++++++++++++++++++++From MQ:', body);
        var gatewaycode = body.split("_")[1];//获取网关sn

        var sockon = map.get(gatewaycode);  //根据网关编号获取当前网关连接
        var returnData = new Buffer(body.split("_")[0], 'hex');
        sockon.write(returnData);//返回给网关数据
    });

    client.subscribe("/queue/queue2", function (body, headers) {
        console.log('新网关注册步骤二+++++++++++++++++++++++++++From MQ:', body);
        var gatewaycode = body.split("_")[1];//获取网关sn

        var sockon = map.get(gatewaycode);  //根据网关编号获取当前网关连接
        var returnData = new Buffer(body.split("_")[0], 'hex');
        sockon.write(returnData);//返回给网关数据
    });
});

//连接网关
net.createServer(function (sock) {
    try {

        sock.name = '网关' + (++p);

        clientList.push(sock); //把当前连接放入list中

        showClients();//显示当前在线网关

        sock.on('data', function (data) {  //连接网关后进行操作
            broadcast(data, sock);
        });

        sock.on('close', function () {    //断开连接
            console.log(sock.name + '——————————此网关已关闭！！！！！！！: ');

            sock.end();//连接结束
            sock.destroy();//销毁连接
            map.remove(addressMap.get(sock));//从网关信息map中移除当前编号的网关
            addressMap.remove(sock);//从网关编号map中移除当前连接
            clientList.splice(clientList.indexOf(sock), 1);
        });

        //异常处理
        sock.on('error', function (err) {
            console.error("发生错误！！！！！！！！！：" + err);
            sock.end();//连接结束
            sock.destroy();//销毁连接
            map.remove(addressMap.get(sock));//从网关信息map中移除当前编号的网关
            addressMap.remove(sock);//从网关编号map中移除当前连接
            clientList.splice(clientList.indexOf(sock), 1);
        });

        //监听客户端终止
        sock.on('end', function () {
            console.log('有客户机下线了！！！！！！！：' + sock.name + 'quit');//如果某个客户端断开连接，node控制台就会打印出来
            clientList.splice(clientList.indexOf(sock), 1);
        });

        var waitTime = 120;//设置连接超时时间

        //设置超时时间
        sock.setTimeout(1000 * waitTime, function () {
            console.log('客户端在' + waitTime + 's内未通信，将断开连接...');
        });
        //监听到超时事件，断开连接
        sock.on('timeout', function () {
            console.log('客户端已断开连接...');
            sock.end();//连接结束
            sock.destroy();//销毁连接
            map.remove(addressMap.get(sock));//从网关信息map中移除当前编号的网关
            addressMap.remove(sock);//从网关编号map中移除当前连接
        });

    } catch (e) {
        console.log(e);
    }
}).listen(PORT, HOST);


//连接网关后进行操作
function broadcast(data, sock) {
    try {
        var gatewayMessage = new Buffer(data, 'hex').toString('hex');//这是网关发来的报文

        var packageType = gatewayMessage.substring(6, 8);//数据包类型

        console.log('CONNECTED: ' +
            sock.remoteAddress + ':' + sock.remotePort);
        console.log('DATA ' + sock.remoteAddress + ': ' + gatewayMessage);
        console.log('Date:' + getNowFormatDate());


        if (packageType == "01") { //当数据包类型为 0x01时代表注册操作
            var gatewayId = gatewayMessage.substring(8, 24);//网关id
            var gatewayCode2 = new Buffer(gatewayId, "hex").toString("utf-8");//网关id

            addressMap.remove(map.get(gatewayCode2)); //移除当前网关上一个连接（已断开或超时的连接）
            map.remove(gatewayCode2); //移除当前网关上一个连接（已断开或超时的连接）

            map.put(gatewayCode2, sock);//重新放入网关信息
            addressMap.put(sock, gatewayCode2);//重新放入网关信息

            console.log("网关ID：十六进制：" + gatewayId + "，ASCII：" + new Buffer(gatewayId, "hex").toString("utf-8"));
            var returnData = new Buffer('faaf06010000', 'hex');
            sock.write(returnData);//返回给客户端（网关）数据
        }
        if (packageType == "06") { //当数据包类型为 0x06时代表返回心跳
            console.log("收到网关心跳，返回确认信息");

            console.log(gatewayMessage);

            var chairList1 = gatewayMessage.substring(10, 12);//数据包类型(心跳包中一个字节占8位，截取第一个字节)
            var chairList2 = gatewayMessage.substring(12, 14);//截取第二个字节
            var chairList3 = gatewayMessage.substring(14, 16);//截取第三个字节
            var chairList4 = gatewayMessage.substring(16, 18);//截取第四个字节
            var chairList5 = gatewayMessage.substring(18, 20);//截取第五个字节
            var chairList6 = gatewayMessage.substring(20, 22);//截取第六个字节
            var chairList7 = gatewayMessage.substring(22, 24);//截取第七个字节
            var chairList8 = gatewayMessage.substring(24, 26);//截取第八个字节

            chairList1 = parseInt(chairList1, 16).toString(2);//16进制转为2进制
            chairList2 = parseInt(chairList2, 16).toString(2);
            chairList3 = parseInt(chairList3, 16).toString(2);
            chairList4 = parseInt(chairList4, 16).toString(2);
            chairList5 = parseInt(chairList5, 16).toString(2);
            chairList6 = parseInt(chairList6, 16).toString(2);
            chairList7 = parseInt(chairList7, 16).toString(2);
            chairList8 = parseInt(chairList8, 16).toString(2);

            var chairLists = [chairList1, chairList2, chairList3, chairList4, chairList5, chairList6, chairList7, chairList8];//放在一个list中
            var newChairList = "";

            for (var a = 0; a < chairLists.length; a++) {  //遍历list
                var chairList = chairLists[a];

                for (var b = 0; b < 9; b++) {
                    if (chairList.length < 8) {      //每一位占八个字节，转换后如果不够八个字节，前面补0
                        chairList = "0" + chairList;
                    }
                }

                String.prototype.reverse = function () {  //反转字符串(转换后的字节前后颠倒，才是需要的正确的字符串)
                    var a = [];
                    for (var i = 0; i < 9; i++) {
                        a.unshift(this[i]);
                    }
                    return a.join("");
                };

                newChairList = newChairList + chairList.reverse(); //每一位转换后的字节点前后颠倒后拼接起来，就是需要的心跳包数据
            }

            var gatewayCode2 = addressMap.get(sock);  //获取网关编号

            client.publish(heartbeatDest, newChairList + "_" + gatewayCode2);//心跳包后边拼接网关编号，防止混淆

            var returnData = new Buffer('faaf06060000', 'hex');
            sock.write(returnData);//返回给网关数据
        }

        if (packageType == "03") {  //修改网关端口
            var chairSuccess = gatewayMessage.substring(8, 10);//椅子操作后返回的类型\
            var port = gatewayMessage.substring(48, 52);
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");

            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "修改端口成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "指令错误");
            }
            client.publish(destination2, returnMsg);//如果未响应，返回给web
            allBody = "";
        }

        if (packageType == "04") {//修改网关频道
            var chairSuccess = gatewayMessage.substring(8, 10);//椅子操作后返回的类型
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "修改频道成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "指令错误");
            }
            client.publish(destination2, returnMsg);//如果未响应，返回给web
            allBody = "";
        }

        if (packageType == "05") {//重启网关


            var chairSuccess = gatewayMessage.substring(8, 10);//网关操作后返回的类型
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "网关重启成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "指令错误");
            }

            client.publish(destination2, returnMsg);//如果未响应，返回给web
            // sock.end();

            map.remove(addressMap.get(sock));//从网关信息map中移除当前编号的网关
            addressMap.remove(sock);//从网关编号map中移除当前连接
            sock.close();
            sock.destroy();//销毁连接

            clientList.splice(clientList.indexOf(sock), 1);
            allBody = "";
        }

        if (packageType == "09") {//启动按摩椅
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "启动成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else if (chairSuccess == "ff") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
            }
            client.publish(destination2, returnMsg);//如果未响应，返回给web
            allBody = "";
        }
        if (packageType == "10") {//停止按摩椅
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "停止成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
            }
            client.publish(destination2, returnMsg);//如果未响应，返回给web
            allBody = "";
        }

        if (packageType == "13") {//开启充电
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "开启充电成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "14") {//关闭充电
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "结束充电成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "15") {//设置强度为强
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩强度弱强度设置成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "16") {//设置强度为中
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩强度中强度设置成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "17") {//设置强度为弱
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩强度强强度设置成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "18") {//暂停按摩椅
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩椅暂停成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "19") {//继续按摩椅
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩椅继续成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "08") {//查询设备状态
            console.log(gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩椅状态：空闲");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩椅状态：工作中");
            } else if (chairSuccess == "03") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩椅状态：复位中");
            } else if (chairSuccess == "ff") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "按摩椅状态：未响应");
            }
            client.publish(destination2, returnMsg);//如果未响应，返回给web
            allBody = "";
            // console.log(chairSuccess);
            // var chairSuccess2 = hex_to_bin(chairSuccess);
            // console.log(chairSuccess2);
            //
            // var chairList1 = chairSuccess2.substring(0, 1);//数据包类型(心跳包中一个字节占8位，截取第一个字节)
            // var chairList2 = chairSuccess2.substring(1, 2);//截取第二个字节
            // var chairList3 = chairSuccess2.substring(2, 3);//截取第三个字节
            // var chairList4 = chairSuccess2.substring(3, 4);//截取第四个字节
            // var chairList5 = chairSuccess2.substring(4, 5);//截取第五个字节
            // var chairList6 = chairSuccess2.substring(5, 6);//截取第六个字节
            // var chairList7 = chairSuccess2.substring(6, 7);//截取第七个字节
            // var chairList8 = chairSuccess2.substring(7, 8);//截取第八个字节
            // console.log(chairList1);
            // console.log(chairList2);
            // console.log(chairList3);
            // console.log(chairList4);
            // console.log(chairList5);
            // console.log(chairList6);
            // console.log(chairList7);
            // console.log(chairList8);
            //
            // chairList1 = hex_to_bin(0+chairList1);//16进制转为2进制
            // chairList2 = hex_to_bin(0+chairList2);
            // chairList3 = hex_to_bin(0+chairList3);
            // chairList4 = hex_to_bin(0+chairList4);
            // chairList5 = hex_to_bin(0+chairList5);
            // chairList6 = hex_to_bin(0+chairList6);
            // chairList7 = hex_to_bin(0+chairList7);
            // chairList8 = hex_to_bin(0+chairList8);
            //
            // console.log("-------------------------");
            //
            // console.log(chairList1);//7
            // console.log(chairList2);//6
            // console.log(chairList3);//5
            // console.log(chairList4);//4
            // console.log(chairList5);//3
            // console.log(chairList6);//2
            // console.log(chairList7);//1
            // console.log(chairList8);//0
            //
            // console.log("-------------------------");
            //
            // if(chairSuccess=="01"  || chairSuccess=="02" || chairSuccess=="03"){
            //     if(chairSuccess=="01"){
            //
            //     }
            // }
        }

        if (packageType == "11") {//修改按摩椅频道
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "修改椅子频道成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else if (chairSuccess == "ff") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, returnMsg);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "12") {//修改按摩椅编号
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "修改椅子编号成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else if (chairSuccess == "ff") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, returnMsg);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "21") {//网关注册新
            var gatewayStep = gatewayMessage.substring(24, 26);//网关注册步骤
            var gatewayCode = gatewayMessage.substring(8, 24);//16进制网关编号
            var gatewayCodeAsc = new Buffer(gatewayCode, "hex").toString("utf-8");//ascii椅子编号

            addressMap.remove(map.get(gatewayCodeAsc)); //移除当前网关上一个连接（已断开或超时的连接）
            map.remove(gatewayCodeAsc); //移除当前网关上一个连接（已断开或超时的连接）

            map.put(gatewayCodeAsc, sock);//重新放入网关信息
            addressMap.put(sock, gatewayCodeAsc);//重新放入网关信息

            if (gatewayStep == "01") {
                client.publish(register, gatewayCode + "_" + 1);
            }
            if (gatewayStep == "02") {
                client.publish(register, gatewayCode + "_" + 2);
            }
            console.log("网关注册成功！网关ID：十六进制：" + gatewayId + "，ASCII：" + new Buffer(gatewayId, "hex").toString("utf-8"));
        }
    } catch (e) {
        console.log();
    }



}


function hex_to_bin(str) {
    var hex_array = [{key:0,val:"0000"},{key:1,val:"0001"},{key:2,val:"0010"},{key:3,val:"0011"},{key:4,val:"0100"},{key:5,val:"0101"},{key:6,val:"0110"},{key:7,val:"0111"},
        {key:8,val:"1000"},{key:9,val:"1001"},{key:'a',val:"1010"},{key:'b',val:"1011"},{key:'c',val:"1100"},{key:'d',val:"1101"},{key:'e',val:"1110"},{key:'f',val:"1111"}];

    var value="";
    for(var i=0;i<str.length;i++){
        for(var j=0;j<hex_array.length;j++){
            if(str.charAt(i)== hex_array[j].key){
                value = value.concat(hex_array[j].val);
                break;
            }
        }
    }
    return value;
}



function bin_to_hex(str) {
    var hex_array = [{key:0,val:"0000"},{key:1,val:"0001"},{key:2,val:"0010"},{key:3,val:"0011"},{key:4,val:"0100"},{key:5,val:"0101"},{key:6,val:"0110"},{key:7,val:"0111"},
        {key:8,val:"1000"},{key:9,val:"1001"},{key:'a',val:"1010"},{key:'b',val:"1011"},{key:'c',val:"1100"},{key:'d',val:"1101"},{key:'e',val:"1110"},{key:'f',val:"1111"}]
    var value = '';
    var list=[];
    // console.log(str);
    if(str.length%4!==0){
        var a = "0000";
        var b=a.substring(0,4-str.length%4);
        str = b.concat(str);
    }
    // console.log(str)
    while (str.length > 4) {
        list.push(str.substring(0, 4));
        str = str.substring(4);
    }
    list.push(str);
    // console.log(list);
    for(var i=0;i<list.length;i++){
        for(var j=0;j<hex_array.length;j++){
            if(list[i]==hex_array[j].val){
                value = value.concat(hex_array[j].key);
                break;
            }
        }
    }
    // console.log(value);
    return value;
}
