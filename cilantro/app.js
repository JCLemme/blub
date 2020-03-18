var express = require('express');
var http = require('http');
guaclite = require('guacamole-lite');

var app = express();

var server = http.createServer(app);


if(process.argv.length < 6) {
    console.log('Usage: blub-cilantro <guacd host> <guacd port> <cilantro host> <cilantro port>');
    process.exit(1);
}

console.log('Binding guacd at ' + process.argv[2] + ':' + process.argv[3] + ' to ' + process.argv[4] + ':' + process.argv[5]);

var guacserver = new guaclite({server}, {host: process.argv[2], port: Number(process.argv[3]) }, {crypt: {cypher: 'AES-256-CBC', key: 'SecretCollector12846193397297403'}, log: {level: 'DEBUG'}});

server.listen(process.argv[5], process.argv[4]);

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  process.exit(1);
});

process.on('SIGTERM', function() {
  console.log( "\nGracefully shutting down from SIGTERM" );
  process.exit(1);
});


module.exports = app;
