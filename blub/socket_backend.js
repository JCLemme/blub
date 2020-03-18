const fs = require('fs');
var websocket = require('ws')
var blubsetup = require('./blub_setup.js')

var _sockets = {};

send = function(username, message) {
    if(username in _sockets) {
    
        for(var i=0;i<_sockets[username].length;i++) {
            if(_sockets[username][i] instanceof websocket) {
                if(_sockets[username][i].readyState == 1) {
                    _sockets[username][i].send(message);
                }
            }
        }
        
    }
};

register = function(username, socket) {
    if(!(username in _sockets)) 
        _sockets[username] = [];
        
    _sockets[username].add(socket);
};

module.exports.send = send;
module.exports.register = register;
