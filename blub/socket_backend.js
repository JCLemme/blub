const fs = require('fs');
var websocket = require('ws')
var blubsetup = require('./blub_setup.js')

var _sockets = {};

send = function(username, message) {
    if(username in _sockets) {
    
        for(var i=_sockets[username].length-1;i>=0;i--) {
            if(_sockets[username][i] instanceof websocket) {
                if(_sockets[username][i].readyState == 1) {
                    _sockets[username][i].send(message);
                }
                else {
                    _sockets[username].splice(i, 1);
                }
            }
        }
        
    }
};

register = function(username, socket) {
    if(!(username in _sockets)) 
        _sockets[username] = [];
        
    _sockets[username].push(socket);
};

module.exports.send = send;
module.exports.register = register;
