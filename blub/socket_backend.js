const fs = require('fs');
var websocket = require('ws')
var blubsetup = require('./blub_setup.js')

var _sockets = {};

send = function(username, message) {
    if(username in _sockets) {
    
        for(var i=_sockets[username]['sockets'].length-1;i>=0;i--) {
            if(_sockets[username]['sockets'][i] instanceof websocket) {
                if(_sockets[username]['sockets'][i].readyState == 1) {
                    _sockets[username]['sockets'][i].send(message);
                }
                else {
                    _sockets[username]['sockets'].splice(i, 1);
                }
            }
        }
        
    }
};

register = function(username, socket) {
    if(!(username in _sockets)) {
        _sockets[username] = {'sockets': [], 'pass': ""};
    }
    
    _sockets[username]['sockets'].push(socket);
};

pass = function(username, password) {
    if(!(username in _sockets)) {
        _sockets[username] = {'sockets': [], 'pass': ""};
    }
    
    _sockets[username]['pass'] = password;
}

credentials = function(username) {
    if(username in _sockets) {
        return _sockets[username]['pass'];
    }
    
    return "";
};

module.exports.send = send;
module.exports.register = register;
module.exports.pass = pass;
module.exports.credentials = credentials;
