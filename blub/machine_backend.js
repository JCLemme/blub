const fs = require('fs');

var machines = [];

var load = function(filename) {
    var rawdata = fs.readFileSync('./machines.json');
    machines = JSON.parse(rawdata);
    console.log("Loaded " + machines.length + " machines.");
};

var open = function(username, reservation) {
    for(var i=0;i<machines.length;i++) {
        if(machines[i]["user"] == "" && machines[i]["reservation"] == reservation) {
            // We found a free machine. Expire in two hours plz
            var expiration = new Date();
            expiration.setHours(expiration.getHours() + 2);
            
            machines[i]["user"] = username;
            machines[i]["until"] = expiration;
            
            return machines[i];
        }
    }
    
    return null;
}

var check = function(username) {
    for(var i=0;i<machines.length;i++) {
        if(machines[i]["user"] == username) {
            return machines[i];
        }
    }
    
    return null;
}

var close = function(username) {
    for(var i=0;i<machines.length;i++) {
        if(machines[i]["user"] == username) {
            machines[i]["user"] = "";
            machines[i]["until"] = "";
            
            return true;
        }
    }
    
    return false;
}

module.exports.load = load;
module.exports.open = open;
module.exports.check = check;
module.exports.close = close;
