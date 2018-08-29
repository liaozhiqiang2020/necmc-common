var Stomp = require('./client2');
var destination = '/topic/myTopic';
var destination2 = '/topic/youTopic';
var client = new Stomp('127.0.0.1', 61613, 'user', 'pass');

client.connect(function(sessionId) {
    client.subscribe(destination, function(body, headers) {
        console.log('From MQ:', body);
    });

    client.subscribe(destination2, function(body, headers) {
        console.log('From MQ2:', body);
    });
});

