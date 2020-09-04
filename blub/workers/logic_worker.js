const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

var MachineWorker = require('@workers/machine_worker')
var UserWorker = require('@workers/user_worker')

var BlubSetup = require('@root/blub_setup.js');
var BlubGlobals = require('@root/blub_globals.js');

/*
 *    _
 *   /. \ /|    blub
 *  (_   X |    
 *   \_V/ \|    copyright 2020- john lemme and co
 * 
 */
 

async function find_user_a_machine(user) {
    
    // Attempts to give a user a machine. Sets their queue timer if there are no free machines.
    var given_machine = await MachineWorker.assign_machine(user['reservation']);
    
    if(given_machine == false) {
        
        // Put the user in the queue
        await UserWorker.queue_join(user);
        return 'queued';
    }
    else {
        
        // Assign their machine
        console.log(given_machine);
        
        await UserWorker.assign_machine(user, given_machine);
        return 'assigned';
    }
};

async function remove_user_from_machine(user) {

    // Force unassigns a machine from a user.
}

module.exports.find_user_a_machine = find_user_a_machine
module.exports.remove_user_from_machine = remove_user_from_machine
