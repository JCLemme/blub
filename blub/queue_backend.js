var machines = require('./machine_backend.js')
var winrm = require('nodejs-winrm');

var _entries = [];

var refresh = function() {
    for(var i=0;i<_entries.length;i++) {
        _entries[i]['on_movement'](_entries[i]['socket'], i)
    }
};

var append = function(socket, username, onMovement, onCalled) {
    if(check(username) != null) {
        return false;
    }
    
    entry = { 'socket': socket, 'user': username, 'date': Date.now(), 'on_movement': onMovement, 'on_called': onCalled };
    _entries.push(entry);
    console.log(_entries);
    
    refresh();
    return true;
};

var check = function(username) {
    for(var i=0;i<_entries.length;i++) {
        if(_entries[i]['user'] == username)
            return i;
    }
    
    return null;
};

var redirect = function(username, socket) {
    for(var i=0;i<_entries.length;i++) {
        if(_entries[i]['user'] == username)
            _entries[i]['socket'] = socket;
            return true;
    }
    
    return false;
};

var remove = function(username) {
    var place = check(username);
    
    if(place == null) {
        return false;
    }
    else {
        _entries.splice(place, 1);
        refresh();
        return true;
    }
};

var nextup = function() {
    // If there are no machines in the queue, do nothing. 
    if(_entries.length < 1) {
        return "queue-empty";
    }
    
    // Run the handler
    var status = _entries[0]['on_called'](_entries[0]['socket'])
    
    // If the handler returned false, they didn't get a machine so do nothing.
    // Else clear them from the queue
    if(status) {
        var name = _entries[0]['user'];
        remove(name)
        return name;
    }
    else {
        return "no-machines";
    }
};

var debuginfo = function() {
    return _entries;
};

module.exports.append = append;
module.exports.check = check;
module.exports.redirect = redirect;
module.exports.remove = remove;
module.exports.refresh = refresh;
module.exports.nextup = nextup;
module.exports.debuginfo = debuginfo;

