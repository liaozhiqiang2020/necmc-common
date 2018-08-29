var net = require('net');

var Stomp = require('./client2');
var destination = '/topic/myTopic';
var destination2 = '/topic/youTopic';
var client = new Stomp('127.0.0.1', 61613, 'user', 'pass');

var HOST = '172.18.216.34';
var PORT = 10917;

var allBody;


client.connect(function (sessionId) {
    client.subscribe(destination, function (body, headers) {
        console.log('From MQ:', body);
        allBody = body;
    });
});


net.createServer(function (sock) {

    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', function (data) {
        var gatewayMessage = new Buffer(data, 'hex').toString('hex');//这是客户端发来的报文
        //gatewayMessage = "faaf0f0135463848514e4a5a0017ed"; //模拟返回信息

        var gatewayId = gatewayMessage.substring(8, 24);//网关id
        var packageType = gatewayMessage.substring(6, 8);//数据包类型

        if (packageType == "08" || packageType == "02") {
            console.log("椅子状态返回：-----------" + gatewayMessage);
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
            // console.log("椅子启动返回：-----------"+gatewayMessage);
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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
            // console.log("椅子停止返回：-----------"+gatewayMessage);
            var chairSuccess = gatewayMessage.substring(24, 26);//椅子操作后返回的类型
            // console.log(chairSuccess);
            var chairCode = gatewayMessage.substring(8, 24);//16进制椅子编号
            // var returnMsg = new Buffer(gatewayMessage,"hex").toString("utf-8");
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

        else {
            console.log('CONNECTED: ' +
                sock.remoteAddress + ':' + sock.remotePort);
            console.log('DATA ' + sock.remoteAddress + ': ' + gatewayMessage);
        }

        if (packageType == "01") { //当数据包类型为 0x01时代表注册操作
            console.log("网关ID：十六进制：" + gatewayId + "，ASCII：" + new Buffer(gatewayId, "hex").toString("utf-8"));
            var returnData = new Buffer('faaf06010000', 'hex');
            sock.write(returnData);//返回给客户端（网关）数据
        }
        else if (packageType == "06") { //当数据包类型为 0x06时代表返回心跳
            console.log("收到网关心跳，返回确认信息");
            var returnData = new Buffer('faaf06060000', 'hex');
            // console.log(new Date());
            sock.write(returnData);//返回给客户端（网关）数据


            // var queryGatewayInfo = new Buffer("faaf06020000","hex");
            // sock.write(queryGatewayInfo);
            // console.log("正在查看网关信息：-----------");
            //
            // opMc.operationMc(type,chairCode,time,sock,gatewayMessage);

            // var startChair = new Buffer("faaf0f0932303030303030323c0000","hex");
            // sock.write(startChair);
            // console.log("启动椅子：-----------");

            // var endChair = new Buffer("faaf0e1032303030303030320000","hex");
            // sock.write(endChair);
            // console.log("停止椅子：-----------");

            // var queryChairStatus = new Buffer(allBody,"hex");
            // sock.write(queryChairStatus);
            // console.log("正在查询椅子状态：-----------");


        }

        // clientConent(sock);

        setInterval(function () {
            // console.log(allBody);
            if (allBody != undefined && allBody != "") {
                var type = allBody.substring(6, 8);//数据包类型
                if (type == "03") {

                    var startChair = new Buffer(allBody, "hex");
                    // console.log(startChair);
                    sock.write(startChair);
                    console.log("修改端口：-----------");
                    return allBody = "";
                }

                if (type == "04") {

                    var startChair = new Buffer(allBody, "hex");
                    // console.log(startChair);
                    sock.write(startChair);
                    console.log("修改频道：-----------");
                    return allBody = "";
                }

                if (type == "05") {
                    var startChair = new Buffer(allBody, "hex");
                    // console.log(startChair);
                    sock.write(startChair);
                    console.log("重启网关：-----------");
                    return allBody = "";
                }

                if (type == "09") {

                    var startChair = new Buffer(allBody, "hex");
                    // console.log(startChair);
                    sock.write(startChair);
                    console.log("启动椅子：-----------");
                    return allBody = "";
                }
                if (type == "10") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("停止椅子：-----------");
                    return allBody = "";
                }
                if (type == "13") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("充电开：-----------");
                    return allBody = "";
                }
                if (type == "14") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("充电关：-----------");
                    return allBody = "";
                }
                if (type == "15") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("弱：-----------");
                    return allBody = "";
                }
                if (type == "16") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("中：-----------");
                    return allBody = "";
                }
                if (type == "17") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("强：-----------");
                    return allBody = "";
                }
                if (type == "18") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("暂停：-----------");
                    return allBody = "";
                }
                if (type == "19") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("继续：-----------");
                    return allBody = "";
                }
                if (type == "08") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("查询椅子状态：-----------");
                    return allBody = "";
                }

                if (type == "11") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("修改椅子频道：-----------");
                    return allBody = "";
                }

                if (type == "12") {
                    var endChair = new Buffer(allBody, "hex");
                    sock.write(endChair);
                    console.log("修改椅子编号：-----------");
                    return allBody = "";
                }
            }
        }, 500);


    });

    sock.on('close', function (data) {
        console.log('CLOSED: ' +
            sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT, HOST);
