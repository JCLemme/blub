const fs = require('fs');

var _machines = [];

var load = function(filename) {
    var rawdata = fs.readFileSync('./machines.json');
    _machines = JSON.parse(rawdata);
    console.log("Loaded " + _machines.length + " machines.");
};

var open = function(socket, username, reservation, onTerminate, onKill) {
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] == "" && _machines[i]["reservation"] == reservation) {
            // We found a free machine. Expire in two hours plz
            var expiration = new Date();
            //expiration.setHours(expiration.getHours() + 2);
            expiration.setMinutes(expiration.getMinutes() + 1);
            
            _machines[i]["user"] = username;
            _machines[i]["socket"] = socket;
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

var redirect = function(username, socket) {
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] == username) {
            _machines[i]["socket"] = socket;
            return true;
        }
    }
    
    return false;
}

var close = function(username) {
    for(var i=0;i<_machines.length;i++) {
        if(_machines[i]["user"] == username) {
            _machines[i]["user"] = "";
            _machines[i]["socket"] = "";
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

var cull = function() {

    // Mark them for DEATH
    for(var i=_machines.length-1;i>=0;i--) {
        
        // First - see if they're active and if their time is up
        if(_machines[i]["user"] != "" && Date.now() > Number(_machines[i]["until"]) ) {
        
            // Then run the required battery of tests
            if(_machines[i]["on_terminate"] != "") {
                var expiration = new Date();
                expiration.setMinutes(expiration.getMinutes() + 1);
                
                _machines[i]["until"] = expiration;
                _machines[i]["on_terminate"](_machines[i]["socket"], _machines[i]);
                _machines[i]["on_terminate"] = "";
            }
            else {
                // F-F-F-FATALITY
                _machines[i]["on_kill"](_machines[i]["socket"], _machines[i]);
                close(_machines[i]["user"]);

                // Sends WinRM command to log user off
                var un = '.\\a';
                var pw = 'sbte';

                var host = '';
                var port = '';

                winrm.runCommand('logoff', host, un, pw, port);

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

module.exports.load = load;
module.exports.open = open;
module.exports.check = check;
module.exports.redirect = redirect;
module.exports.close = close;
module.exports.debuginfo = debuginfo;
module.exports.cull = cull;
module.exports.reservation = reservation;
