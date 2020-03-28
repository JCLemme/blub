const fs = require('fs');
var websocket = require('ws')
var BlubSetup = require('@root/blub_setup.js')

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
        _sockets[username] = {'sockets': [], 'pass': "", 'computer-socket': ""};
    }
    
    _sockets[username]['sockets'].push(socket);
};

pass = function(username, password) {
    if(!(username in _sockets)) {
        _sockets[username] = {'sockets': [], 'pass': "", 'computer-socket': ""};
    }
    
    _sockets[username]['pass'] = password;
}

credentials = function(username) {
    if(username in _sockets) {
        return _sockets[username]['pass'];
    }
    
    return "";
};

watchdog_connection = function(username, socket) {
    if(!(username in _sockets)) {
        _sockets[username] = {'sockets': [], 'pass': "", 'computer-socket': ""};
    }
    
    _sockets[username]['computer-socket'] = socket;
};

send_watchdog = function(username, message) {
    if(username in _sockets) {
        if(_sockets[username]['computer-socket'] instanceof websocket) {
            if(_sockets[username]['computer-socket'].readyState == 1) {
                _sockets[username]['computer-socket'].send(message);
            }
            else {
                // Do nothin
            }
        }
    }
}

module.exports.send = send;
module.exports.register = register;
module.exports.pass = pass;
module.exports.credentials = credentials;
module.exports.watchdog_connection = watchdog_connection;
module.exports.send_watchdog = send_watchdog;
