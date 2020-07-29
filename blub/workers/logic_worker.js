const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

var BlubSetup = require('@root/blub_setup.js');
var BlubGlobals = require('@root/blub_globals.js');

var MachineWorker = require('@workers/machine_worker')

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
        UserWorker.queue_join(user);
    }
    else {
        
        // Assign their machine
        UserWorker.give_machine(user, given_machine);
    }
};


