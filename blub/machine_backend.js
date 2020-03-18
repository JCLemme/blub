const fs = require('fs');
var blubsetup = require('./blub_setup.js')
var blubglobals = require('./blub_globals.js')

var _machines = [];

var load = function(filename) {
    var rawdata = fs.readFileSync(filename);
    _machines = JSON.parse(rawdata);
    console.log("    Loaded " + _machines.length + " machines.");
};

var save = function(filename) { 
    fs.writeFileSync(filename, JSON.stringify(_machines));
    console.log("    Saved " + _machines.length + " machines.");
};

var open = function(username, reservation, onTerminate, onKill) {
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] == "" && _machines[i]["reservation"] == reservation) {
            // We found a free machine. Expire in two hours plz
            var expiration = new Date();
            //expiration.setHours(expiration.getHours() + 2);
            expiration.setMinutes(expiration.getMinutes() + blubglobals.data['time-term']);
            
            _machines[i]["user"] = username;
            _machines[i]["until"] = expiration;
            _machines[i]["on_terminate"] = onTerminate;
            _machines[i]["on_kill"] = onKill;
            
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
            _machines[i]["on_terminate"] = "";
            _machines[i]["on_kill"] = "";
            
            return true;
        }
    }
    
    return false;
}

var debuginfo = function() {
    return _machines;
};

var cull = function(reservation) {

    // Mark them for DEATH
    for(var i=_machines.length-1;i>=0;i--) {
        
        // First - see if they're active and if their time is up and if they aren't reserved
        if(_machines[i]["user"] != "" && Date.now() > Number(_machines[i]["until"]) && _machines[i]['reservation'] == reservation) {
        
            // Then run the required battery of tests
            if(_machines[i]["on_terminate"] != "") {
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + blubglobals.data['time-kill']);
                
                _machines[i]["until"] = expiration;
                _machines[i]["on_terminate"](_machines[i]);
                _machines[i]["on_terminate"] = "";
            }
            else {
                // F-F-F-FATALITY
                _machines[i]["on_kill"](_machines[i]);
                close(_machines[i]["user"]);
            }
        }
    }
}

var reservation = function(reservation) {
    var found = 0;
    var full = 0;
    
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["reservation"] == reservation) {
            found++;
            
            if(_machines[i]["user"] != "") {
                full++;
            }
        }
    }
    
    if(found == 0)
        return 'invalid-class';
    else if(found == full) 
        return 'class-full';
    else
        return found-full;
}

var reserve_machine = function(machine, reservation) {
    if (_machines[machine]){
        _machines[machine]["reservation"] = reservation;
        return true;
    } else {
        return false;
    }
};

var reserve = function(reservation, original, amount) {
    var found = 0;
    
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] != "") {
            if(_machines[i]["reservation"] == original) {
                found++;
                _machines[i]["reservation"] = reservation;
                
                if(found == amount) 
                    return found;
            }
        }
    }
    
    return found;
}

var time_at = function(place) {
    // Sort the array
    var filtered = _machines.slice().filter(function(a) { return a['until'] != "" });
    filtered.sort(function(a, b) { return a['until'] - b['until'] });
    
    if(_machines.length == filtered.length) {
        if(place >= filtered.length) 
            return -1;
        else 
            return filtered[place]['until'] - Date.now();
    }
    else {
        return 0;
    }
}

module.exports.load = load;
module.exports.save = save;
module.exports.open = open;
module.exports.check = check;
module.exports.close = close;
module.exports.debuginfo = debuginfo;
module.exports.cull = cull;
module.exports.reserve = reserve;
module.exports.reserve_machine = reserve_machine;
module.exports.reservation = reservation;
module.exports.time_at = time_at;
