const fs = require('fs');

var machines = require('./machine_backend.js')

var _entries = [];

var refresh = function() {
    for(var i=0;i<_entries.length;i++) {
        _entries[i]['on_movement'](i)
    }
};

var append = function(username, onMovement, onCalled) {
    if(check(username) != null) {
        return false;
    }
    
    entry = { 'user': username, 'date': Date.now(), 'on_movement': onMovement, 'on_called': onCalled };
    _entries.push(entry);
    console.log(_entries);

    // Backup logic: dumps current _entries array to a .json file.
    currentTime = Date.now()
    fileName = `./queueBackup ${currentTime}`;
    fs.writeFile(fileName, JSON.stringify(_entries), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log('Backup created');
    });
    
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

        // Backup logic: dumps current _entries array to a .json file.
        currentTime = Date.now()
        fileName = `./queueBackup ${currentTime}`;
        fs.writeFile(fileName, JSON.stringify(_entries), (err) => {
            if (err) {
                console.error(err);
                return;
            };
            console.log('Backup created');
        });

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
    var status = _entries[0]['on_called']();
    
    // If the handler returned false, they didn't get a machine so do nothing.
    // Else clear them from the queue
    if(status) {
        var name = _entries[0]['user'];
        remove(name)

        // Backup logic: dumps current _entries array to a .json file.
        currentTime = Date.now()
        fileName = `./queueBackup $currentTime`;
        fs.writeFile(fileName, JSON.stringify(_entries), (err) => {
            if (err) {
                console.error(err);
                return;
            };
            console.log('Backup created');
        });

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
module.exports.remove = remove;
module.exports.refresh = refresh;
module.exports.nextup = nextup;
module.exports.debuginfo = debuginfo;

