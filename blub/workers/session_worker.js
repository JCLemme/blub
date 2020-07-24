const fs = require('fs');
var websocket = require('ws')
var BlubSetup = require('@root/blub_setup.js')

/*
 *    _
 *   /. \ /|    blub
 *  (_   X |    
 *   \_V/ \|    copyright 2020- john lemme and co
 * 
 */
 
/* note:
 *
 * session worker acts as a storage for variables that are dependent on login session
 * and should *not* be stored in the database.
 *
 * THIS INCLUDES PASSWORDS!!!!!!!!
 *
 * session worker caches the user's login password so that blub can automagically
 * log in to remote sessions. it doesn't write this data anywhere, and it is lost
 * if blub restarts; however, it isn't stored in any encrypted fashion (as it should
 * be), so an exploit that can read blub's memory would find all these passwords
 * stored in convenient username->password format.
 *
 * if this is a risk you feel comfortable taking, no action is needed.
 *
 * if it isn't, go into your local blub_setup.js and set "session_password" to false.
 * this disables blub's password cache and prompts the user to reenter their password
 * when connecting to a remote session.
 *
 * this feature was added because some people get frustrated and/or scared at having
 * to enter their password twice in one session.
 */
 
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
