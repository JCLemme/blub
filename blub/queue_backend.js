
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


module.exports.append = append;
module.exports.check = check;
module.exports.remove = remove;
module.exports.refresh = refresh;

