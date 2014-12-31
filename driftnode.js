var Path = require('path');
var Hapi = require('hapi');

var server = new Hapi.Server();
var jade = require('jade');
var pcap = require("pcap"), 
    pcap_session ,
    matcher = /GET.*\.[jpg|jpeg|gif|png]/;
var util = require('util');
var Backbone = require('backbone');
var lodash = require('lodash');
var SocketIO = require('socket.io');

var sOptions = {
	host: 'localhost',
	port: '8910'
}

var Model = Backbone.Model.extend({
	url: ''
});

var mCollection = Backbone.Collection.extend({
	model: Model
});

var imageCollection = new mCollection();

function started(error){
	if(!error)
		util.log('Server started: http://localhost:8910/');
}

if (process.argv.length != 3 ){
	util.error('Usage: ' + process.argv[1].split('/').slice(-1)[0] + ' <interface>');
	process.exit(1);
}

var ioHandler = function (socket){
	console.log('a user connected');
};



pcap_session = pcap.createSession(process.argv[2], 'port 80');

server.connection( sOptions );

server.route({
    method: 'GET',
    path: '/js/{param*}',
    handler: {
        directory: {
            path: 'public',
            path: './js'
        }
    }
});

server.route({
    method: 'GET',
    path: '/css/{param*}',
    handler: {
        directory: {
            path: 'public',
            path: './css'
        }
    }
});


server.route({
	method: 'GET',
	path: '/',
	handler: function(request, reply){
		var fn = jade.compileFile('layouts/index.jade', {});
		var html = fn(sOptions);
		reply(html);
	}
});


var io = SocketIO.listen(server.listener);
io.sockets.on('connection', function(socket) {
    
});

pcap_session.on('packet', function(raw_packet){
	var packet = pcap.decode.packet(raw_packet);
    var data = packet.link.ip.tcp.data;

    if (data && matcher.test(data.toString())) {
    	var pdata = data.toString().split('\n');
    	var host, content;
    	if (pdata[0].indexOf('jpg') > 0 || pdata[0].indexOf('jpeg') > 0|| pdata[0].indexOf('jpg') > 0  || pdata[0].indexOf('gif') > 0){
    		if (pdata[1]){
    			content = pdata[0].split(' ')[1];
    			host = pdata[1].split(' ')[1].trim();
    			console.log(host);
    			url = host + content;
    			
    			var tM = new Model({ url: 'http://' + url});
	    		imageCollection.add(tM);
	    		console.log('image added collection length: ' + imageCollection.length);
	    		io.emit('image found', tM);

    		}

    	}
    }
});

server.start(started);

