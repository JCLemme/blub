const fs = require('fs');
var machines = require('./machine_backend.js')
var blubsetup = require('./blub_setup.js')

var _entries = [];

var load = function(filename) {
    var rawdata = fs.readFileSync(filename);
    _entries = JSON.parse(rawdata);
    console.log("  Loaded " + _entries.length + " entries.");
};

var save = function(filename) { 
    fs.writeFileSync(filename, JSON.stringify(_entries));
    console.log("  Saved " + _entries.length + " entries.");
};

var refresh = function() {
    for(var i=0;i<_entries.length;i++) {
        _entries[i]['on_movement'](i)
    }
};

var append = function(username, onMovement, onCalled) {
    if(check(username) != null) {
        return false;
    }
    
    const date = Date.now();
    entry = { 'user': username, 'date': date, 'on_movement': onMovement, 'on_called': onCalled };
    _entries.push(entry);
    
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
    var status = _entries[0]['on_called']()
    
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

module.exports.load = load;
module.exports.save = save;
module.exports.append = append;
module.exports.check = check;
module.exports.remove = remove;
module.exports.refresh = refresh;
module.exports.nextup = nextup;
module.exports.debuginfo = debuginfo;

