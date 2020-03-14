const fs = require('fs');

var _machines = [];

var load = function(filename) {
    var rawdata = fs.readFileSync('./machines.json');
    _machines = JSON.parse(rawdata);
    console.log("Loaded " + _machines.length + " machines.");
};

var open = function(username, reservation) {
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] == "" && _machines[i]["reservation"] == reservation) {
            // We found a free machine. Expire in two hours plz
            var expiration = new Date();
            expiration.setHours(expiration.getHours() + 2);
            
            _machines[i]["user"] = username;
            _machines[i]["until"] = expiration;
            
            return _machines[i];
        }
    }
    
    return null;
}

var check = function(username) {
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] == username) {
            return _machines[i];
        }
    }
    
    return null;
}

var close = function(username) {
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] == username) {
            _machines[i]["user"] = "";
            _machines[i]["until"] = "";
            
            return true;
        }
    }
    
    return false;
}

var debuginfo = function() {
    return _machines;
};

module.exports.load = load;
module.exports.open = open;
module.exports.check = check;
module.exports.close = close;
module.exports.debuginfo = debuginfo;
