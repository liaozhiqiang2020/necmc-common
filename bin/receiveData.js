var net = require('net');
// var opMc = require('sendData');

var HOST = '172.18.216.34';
var PORT = 12345;

// var chairCode="3030303031303031";
// var time = "1e";

net.createServer(function(sock) {

    console.log('CONNECTED: ' +
        sock.remoteAddress + ':' + sock.remotePort);

    sock.on('data', function(data) {
        var gatewayMessage = new Buffer(data,'hex').toString('hex');//这是客户端发来的报文
        //gatewayMessage = "faaf0f0135463848514e4a5a0017ed"; //模拟返回信息

        var gatewayId = gatewayMessage.substring(8,24);//网关id
        var packageType = gatewayMessage.substring(6,8);//数据包类型

        if(packageType == "08" ||packageType == "02"){
            console.log("椅子状态返回：-----------"+gatewayMessage);
        }
        if(packageType == "09"){
            console.log("椅子启动返回：-----------"+gatewayMessage);
        }
        if(packageType == "10"){
            console.log("椅子停止返回：-----------"+gatewayMessage);
        }
        else{
            console.log('CONNECTED: ' +
                sock.remoteAddress + ':' + sock.remotePort);
            console.log('DATA ' + sock.remoteAddress + ': ' + gatewayMessage);
        }

        if(packageType == "01"){ //当数据包类型为 0x01时代表注册操作
            console.log("网关ID：十六进制：" + gatewayId + "，ASCII：" + new Buffer(gatewayId,"hex").toString("utf-8"));
            var returnData = new Buffer('faaf06010000','hex');
            sock.write(returnData);//返回给客户端（网关）数据
        }
        else if (packageType == "06"){ //当数据包类型为 0x06时代表返回心跳
            console.log("收到网关心跳，返回确认信息");
            var returnData = new Buffer('faaf06060000','hex');
            // console.log(new Date());
            sock.write(returnData);//返回给客户端（网关）数据

            var queryChairStatus = new Buffer("faaf0e0832303030303030320000","hex");
            sock.write(queryChairStatus);
            console.log("正在查询椅子状态：-----------");

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

        }

    });

    sock.on('close', function(data) {
        console.log('CLOSED: ' +
            sock.remoteAddress + ' ' + sock.remotePort);
    });

}).listen(PORT, HOST);
