const fs = require('fs');
var websocket = require('ws')
var blubsetup = require('./blub_setup.js')

var _sockets = {};

send = function(username, message) {
    if(username in _sockets) {
        if(_sockets[username] instanceof websocket) {
            if(_sockets[username].readyState == 1) {
                _sockets[username].send(message);
            }
        }
    }
};

register = function(username, socket) {
    _sockets[username] = socket;
};

module.exports.send = send;
module.exports.register = register;
