var hapi = require('hapi');
var server = new hapi.Server();
var jade = require('jade');
var pcap = require("pcap"), 
    pcap_session ,
    matcher = /get.*\.[jpg|jpeg|gif|png]/i;

var util = require('util');
var Backbone = require('backbone');
var lodash = require('lodash');

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


function started(){
	util.log('Server started: http://localhost:8910/');
}

if (process.argv.length != 3 ){
	util.error('Usage: ' + process.argv[1].split('/').slice(-1)[0] + ' <interface>');
	process.exit(1);
}

pcap_session = pcap.createSession(process.argv[2], 'port 80');


server.connection( sOptions );

server.route({
	method: 'GET',
	path: '/',
	handler: function(request, reply){
		reply('hello wolrd');
	}
});


pcap_session.on('packet', function(raw_packet){
	var packet = pcap.decode.packet(raw_packet);
    var data = packet.link.ip.tcp.data;

    

    if (data && matcher.test(data.toString())) {
    	imageCollection.add(new Model({url: data.toString().split('\n')[0].split(' ')[1] }));
    	console.log('image added collection length: ' + imageCollection.length);
    }
});

server.start();

