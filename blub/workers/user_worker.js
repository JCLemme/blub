const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

var BlubSetup = require('@root/blub_setup.js');
var BlubGlobals = require('@root/blub_globals.js');


/*
 *    _
 *   /. \ /|    blub
 *  (_   X |    
 *   \_V/ \|    copyright 2020- john lemme and co
 * 
 */
 
 
function template(username) {
    var user_template = {
        'user': username,               // Username. Acts as their unique identifier.
        'state': 'idle',                // User current state. idle, queueing, in-session, expiring
        
        'in-blub-since': null,          // Datetime when Blub first became aware of this user. Useful for culling stale database entries.
        'in-queue-since': null,         // Datetime since the user declared their intention to get a machine. This only applies for users who didn't get a machine the first time.
        'in-session-until': null,       // Datetime when the user's session will expire (or moves state; in-session -> expiring)
        'reservation': "",              // Class/reservation code the user gave when they joined the queue.
        
        'machine': null,                // Machine this user was assigned. This should be just the hostname/uuid of that machine.
    };
    
    return user_template;
};

async function user_add(username, reservation) {

    var user_template = template(username);
    
    if (!BlubGlobals.database) { return false; }
    
    var usercol = BlubGlobals.database.collection('blub-users');
    await usercol.insertOne(user_template);
    return user_template;
};

async function user_search(username) {

    if (!BlubGlobals.database) { return false; }
    
    var usercol = BlubGlobals.database.collection('blub-users');
    var record = await usercol.findOne({'user': username});
    
    if(record == null) { return false; }
    
    return record;
};

async function queue_join(user) {

    // Make a user template
    user['in-queue-since'] = (new Date()).toJSON();
    
    if (!BlubGlobals.database) { return false; }
    var usercol = BlubGlobals.database.collection('blub-users');
    
    var records = await usercol.find({'user': username});
    if(records.length > 0) { return false; }
    
    await usercol.updateOne(user, user);
    
    return true;
};

async function queue_top() {

    // Look for it in the database
    if (!BlubGlobals.database) { return false; }
    
    var usercol = BlubGlobals.database.collection('blub-users');
    var record = await usercol.findOne( {'in-queue-since': {$not: null} }, { sort: {'in-queue-since': 1} } );
    
    if(record == null) { return false; }
    
    return record;
};

module.exports.connect = connect;
module.exports.user_search = user_search;
module.exports.queue_join = queue_join;
module.exports.queue_top = queue_top;

