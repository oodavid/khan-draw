// For local testing without nginx you can use this
//  to serve the static files AND run app.js with a local socket


// Serve static files
var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var port    = 8010;
http.listen(port, function(){
	console.log('http://localhost:'+port+'/');
});
app.use(express.static(__dirname));
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});