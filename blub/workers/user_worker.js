const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;

var BlubSetup = require('@root/blub_setup.js');
var BlubGlobals = require('@root/blub_globals.js');

function template(username) {
    var user_template = {
        'user': username,
        'state': 'idle',
        
        'in-queue-since': null,
        'in-session-until': null,
        'reservation': ""
    };
    
    return user_template;
}

function async user_search(username) {
    // Look for it in the database
    const client = await MongoClient.connect(BlubSetup.mongo_host, { useNewUrlParser: true }).catch(err => { console.log(err); });

    if (!client) {
        return false;
    }
    
    var db = client.db;
    var usercol = db.collection('blub-users');
    var record = await usercol.findOne({'username': username});
    
    if(record == null) { return false; }
    
    return record;
}

function async queue_join(username, reservation) {
    // Make a user template
    var user_template = template(username);
    user_template['in_queue_since'] = (new Date.now()).toJSON();
    
    // Look for it in the database
    const client = await MongoClient.connect(BlubSetup.mongo_host, { useNewUrlParser: true }).catch(err => { console.log(err); });

    if (!client) {
        return false;
    }
    
    var db = client.db;
    var usercol = db.collection('blub-users');
    var records = await usercol.find({'username': username});
    
    if(records.length > 0) { return false; }
    
    await usercol.insertOne(user_template);
    
    return true;
}

function async queue_top() {
    // Look for it in the database
    const client = await MongoClient.connect(BlubSetup.mongo_host, { useNewUrlParser: true }).catch(err => { console.log(err); });

    if (!client) {
        return false;
    }
    
    var db = client.db;
    var usercol = db.collection('blub-users');
    var record = await usercol.findOne( {'in-queue-since': {$not: null} }, { sort: {'in-queue-since': 1} } );
    
    if(record == null) { return false; }
    
    return record;
}



