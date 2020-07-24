const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

var BlubSetup = require('@root/blub_setup.js');
var BlubGlobals = require('@root/blub_globals.js');

/* The goal of blub 2.0 is that the "queue" stops existing.
 * The queue isn't a line that people can jump in/out of
 * It's a concept defined by machine availability 
 * A user that "joins the queue" is actually just saying that they have wanted a machine since xyz time
 * Like a letter to santa
 * A separate process occasionally searches through the list and picks people who have been waiting to get machines
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

async function user_search(username) {

    if (!BlubGlobals.database) {
        return false;
    }
    
    var usercol = BlubGlobals.database.collection('blub-users');
    var record = await usercol.findOne({'user': username});
    
    if(record == null) { return false; }
    
    return record;
};

async function queue_join(username, reservation) {

    // Make a user template
    var user_template = template(username);
    user_template['in-queue-since'] = (new Date()).toJSON();
    
    if (!BlubGlobals.database) {
        return false;
    }
    
    var usercol = BlubGlobals.database.collection('blub-users');
    var records = await usercol.find({'user': username});
    
    if(records.length > 0) { return false; }
    
    await usercol.insertOne(user_template);
    
    return true;
};

async function queue_top() {

    // Look for it in the database
    if (!BlubGlobals.database) {
        return false;
    }
    
    var usercol = BlubGlobals.database.collection('blub-users');
    var record = await usercol.findOne( {'in-queue-since': {$not: null} }, { sort: {'in-queue-since': 1} } );
    
    if(record == null) { return false; }
    
    return record;
};

module.exports.connect = connect;
module.exports.user_search = user_search;
module.exports.queue_join = queue_join;
module.exports.queue_top = queue_top;

