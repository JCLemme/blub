const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

var BlubSetup = require('@root/blub_setup.js')
var BlubGlobals = require('@root/blub_globals.js')


/*
 *    _
 *   /. \ /|    blub
 *  (_   X |    
 *   \_V/ \|    copyright 2020- john lemme and co
 * 
 */
 

function template(uuid, host, name) {
    var machine_template = {
        'uuid': uuid,                   // Internal ID for the connection. Distinct from the hostname because some machines can support multiple remote sessions.
        'host': host,                   // FQDN (or ip address i suppose). 
        'name': name,                   // Pretty display name for the machine. Probably should match the hostname.
        
        'state': 'idle',                // Machine current state. idle, assigned
        'reservation': '',              // Class/reservation code the machine is tied to.
        
        'reserved-until': null,         // Datetime when the machine will no longer be reserved.
    };
    
    return machine_template;
};

async function add_machine(uuid, host, name) {
    
    // Adds a machine to the database
    var new_machine = template(uuid, host, name);
    
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    await machines.insertOne(new_machine);
};

async function remove_machine(host) {
    
    // Removes a machine from the database
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    await machines.removeOne({'uuid': uuid});
};

async function get_machine(host) {
    
    // Gets a machine by hostname
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    var found = await machines.find({'uuid': uuid});
    
    if(found.length > 0)
        return found[0];
    else
        return false;
};

async function get_machines() {

    // Gets all machines. Not strictly necessary with get_machines_by_query but a good shortcut.
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    return await machines.find({});
};

async function get_machines_by_query(query) {
    
    // Gets machines by database query. A little unfocused but good for weird requests.
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    return await machines.find(query).toArray();
};

async function set_machine(machine) {

    // Sets data for a machine. Takes a whole machine object, uses host from that object as the index.
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    await machines.updateOne(machine, machine);
    return true;
};

async function assign_machine(reservation) {
    
    // Look for a free machine, optionally with reservation code
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    var free_machines = await machines.find({'state': 'idle', 'reservation': reservation}).toArray();
    
    console.log(free_machines);
    
    // Give it out
    if(free_machines.length == 0) {
        return false;
    }
    else {
        await machines.updateOne(free_machines[0], {$set: {'state': 'assigned'}});
        return free_machines[0]['uuid'];
    }
}

async function reserve_machine(uuid, reservation) {

    var machines = BlubGlobals.database.collection('blub-machines');
    var claimed_machine = await machines.findOne({'uuid': uuid});
    
    // Give it out
    if(!claimed_machine) 
        return false;
    else 
        await machines.updateOne(claimed_machine, {$set: {'reservation': reservation}});
}

async function release_machine(uuid) {

    // Frees a machine. Returns false if that machine wasn't actually assigned.
    if(!BlubGlobals.database) {
        return false;
    }
    
    var machines = BlubGlobals.database.collection('blub-machines');
    var release_machine = await machines.findOne({'uuid': uuid});
    
    // Give it out
    if(!release_machine || release_machine['state'] != 'assigned') {
        return false;
    }
    else {
        await machines.updateOne(release_machine, {$set: {'state': 'idle'}});
        return true;
    }
};

module.exports.add_machine = add_machine;
module.exports.remove_machine = remove_machine;
module.exports.get_machine = get_machine;
module.exports.get_machines = get_machines;
module.exports.get_machines_by_query = get_machines_by_query;
module.exports.set_machine = set_machine;
module.exports.assign_machine = assign_machine;
module.exports.release_machine = release_machine;


