var net = require('net');

var Stomp = require('./client2');
var destination = '/topic/myTopic';
var destination2 = '/topic/youTopic';
var client = new Stomp('127.0.0.1', 61613, 'user', 'pass');

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

var map = new Map();

// var HOST = '172.18.216.34';//正式服
var HOST = '172.24.127.99';//测试服
// var HOST = '127.0.0.1';
var PORT = 10917;

var allBody;

client.connect(function (sessionId) {
    client.subscribe(destination, function (body, headers) {
        console.log('From MQ:', body);
        allBody = body;
    });
});

net.createServer(function (sock) {

    try {
        clientList.push(sock);

        sock.on('data', function (data) {
            broadcast(data, sock);
        });

        sock.on('close', function (data) {
            console.log('CLOSED: ' +
                sock.remoteAddress + ' ' + sock.remotePort);
        });

        //异常处理
        sock.on('error', function (err) {
            console.error("出现错误：" + err);
            // debug("出现错误：" + err);
        });

        //监听客户端终止
        sock.on('end', function () {
            console.log('' + sock.name + 'quit');//如果某个客户端断开连接，node控制台就会打印出来
            // debug('' + sock.name + 'quit');//如果某个客户端断开连接，node控制台就会打印出来
            clientList.splice(clientList.indexOf(sock), 1);
        });
    } catch (e) {
        // debug('\r\n', e, '\r\n', e.stack);
        console.log();
    }
}).listen(PORT, HOST);

function broadcast(data, sock) {
    try {
        var gatewayMessage = new Buffer(data, 'hex').toString('hex');//这是客户端发来的报文
        var gatewayId = gatewayMessage.substring(8, 24);//网关id
        var gatewayCode = new Buffer(gatewayId, "hex").toString("utf-8");//网关id
        var packageType = gatewayMessage.substring(6, 8);//数据包类型

        var sockon2 = map.get(gatewayCode);//从map中获取网关信息

        var cleanup = [];
        for (var i = 0; i < clientList.length; i += 1) {
            if (sockon2 !== clientList[i]) {
                console.log("正常");
            } else {
                cleanup.push(sockon2); // 如果不可写，收集起来销毁。销毁之前要 Socket.destroy() 用 API 的方法销毁。
                map.remove(gatewayCode);
                sockon2.destroy();
            }
        }
        for (i = 0; i < cleanup.length; i += 1) {
            clientList.splice(clientList.indexOf(cleanup[i]), 1)
        }

        console.log('CONNECTED: ' +
            sock.remoteAddress + ':' + sock.remotePort);
        console.log('DATA ' + sock.remoteAddress + ': ' + gatewayMessage);

        if (packageType == "01") { //当数据包类型为 0x01时代表注册操作
            map.put(gatewayCode, sock);
            console.log("网关ID：十六进制：" + gatewayId + "，ASCII：" + new Buffer(gatewayId, "hex").toString("utf-8"));
            var returnData = new Buffer('faaf06010000', 'hex');
            sock.write(returnData);//返回给客户端（网关）数据
        }
        if (packageType == "06") { //当数据包类型为 0x06时代表返回心跳
            console.log("收到网关心跳，返回确认信息");
            var returnData = new Buffer('faaf06060000', 'hex');
            sock.write(returnData);//返回给客户端（网关）数据
        }

        if (packageType == "03") {
            var chairSuccess = gatewayMessage.substring(8, 10);//椅子操作后返回的类型
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");

            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "修改端口成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "指令错误");
            }
            client.publish(destination2, returnMsg);//如果未响应，返回给web
            allBody = "";
        }

        if (packageType == "04") {
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

        if (packageType == "05") {
            var chairSuccess = gatewayMessage.substring(8, 10);//椅子操作后返回的类型
            var returnMsg = new Buffer(gatewayMessage, "hex").toString("utf-8");
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "网关重启成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + "指令错误");
            }
            client.publish(destination2, returnMsg);//如果未响应，返回给web
            allBody = "";
        }

        if (packageType == "09") {
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
        if (packageType == "10") {
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            var chairCodeAsc = new Buffer(chairCode, "hex").toString("utf-8");//ascii椅子编号
            if (chairSuccess == "01") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "停止成功");
            } else if (chairSuccess == "02") {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "指令错误");
            } else {
                console.log(sock.remoteAddress + ':' + sock.remotePort + "------" + chairCodeAsc + "未响应");
                client.publish(destination2, chairCodeAsc);//如果未响应，返回给web
            }
            allBody = "";
        }

        if (packageType == "13") {
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

        if (packageType == "14") {
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

        if (packageType == "15") {
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

        if (packageType == "16") {
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

        if (packageType == "17") {
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

        if (packageType == "18") {
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

        if (packageType == "19") {
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

        if (packageType == "08") {
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
        }

        if (packageType == "11") {
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

        if (packageType == "12") {
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


        setInterval(function () {
                if (allBody != undefined && allBody != "") {
                    var gatewaycode = allBody.split("_")[1];//网关sn
                    var type2 = allBody.split("_")[0];//控制命令
                    var type = type2.substring(6, 8);//数据包类型
                    var chairId = type2.substring(8,24);
                    // console.log(chairId);
                    var chairCodeAsc = new Buffer(chairId, "hex").toString("utf-8");//ascii椅子编号
                    // console.log(chairCodeAsc);
                    var endChair = new Buffer(type2, "hex");//转为ascii码
                    try {
                        var sockon = map.get(gatewaycode);
                        if (sockon != "" && sockon != undefined) {
                            if (type == "03") {
                                sockon.write(endChair);
                                console.log("修改端口：-----------");
                                return allBody = "";
                            }

                            if (type == "04") {
                                sockon.write(endChair);
                                console.log("修改频道：-----------");
                                return allBody = "";
                            }

                            if (type == "05") {
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
                        }else{
                            console.log("通信异常！！！！！");
                            client.publish(destination2, "ff"+chairCodeAsc);//如果未响应，返回给web
                            return allBody = "";
                        }
                    }catch(e){
                        console.log("通信异常！！！！！");
                        client.publish(destination2, "ff"+chairCodeAsc);//如果未响应，返回给web
                        return allBody = "";
                    }
                }
            }
            , 500
        );

        /*删除掉服务器的客户端数组中，已断开的客户端*/
        for (var i = 0; i < cleanup.length; i++) {
            clientList.splice(clientList.indexOf(cleanup[i]), 1);
        }
    } catch (e) {
        // debug('\r\n', e, '\r\n', e.stack);
        console.log();
    }


}
