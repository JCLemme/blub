var websocket = require('ws')
var mongodb = require('mongodb')
var queueworker = require('./queue_backend.js')
var machines = require('./machine_backend.js')
var https = require('https')

// Queue worker

function queueRunner() {
    console.log("Another beautiful day in the neighborhood");
    var status = queueworker.nextup();
    
    switch(status) {
        case 'no-machines':
            console.log("  No machines are available to give out")
        break;
        
        case 'queue-empty':
            console.log("  No one's waiting for a machine")
        break;
        
        default:
            console.log("  Looks like " + status + " got a machine")
        break;
    }
    
    setTimeout(queueRunner, 10000);
}

setTimeout(queueRunner, 10000);

// Websocket receiver for clients

wss = new websocket.Server({
    port: 8080,
    
    verifyClient: (info, done) => {
        megasession(info.req, {}, () => {
            done(info.req.session)
        })
    }
});

wss.on('connection', async (ws, req) => {

    // Initialize queue object
    console.log('New connection from ' + req.session.passport.user['sAMAccountName'] + '...');
    
    ws.on('message', message => {
        console.log(`${message}`);
        
        // Parse the message out
        msg = JSON.parse(message);

        switch(msg['request']) {
            case 'init': {
                // See if the user is currently queued, and if so send them some queue
                var place = queueworker.check(req.session.passport.user['sAMAccountName']);
                
                if(place != null) {
                    ws.send(JSON.stringify( { 'status': 'queued', 'place': place } ));
                }
                else {
                
                    // See if the user has a machine attached to them
                    var machine = machines.check(req.session.passport.user['sAMAccountName']);
                    
                    if(machine != null) {
                        ws.send(JSON.stringify( { 'status': 'in-session', 'machine': machine } ));
                    }
                    else {
                    
                        // User must not be doing anything I guess.
                        ws.send(JSON.stringify( { 'status': 'idle' } ));
                    }
                }
            }
            break;
            
            
            
            /// Queue functions

            case 'queue-join': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested queue join');
                
                queueworker.append(req.session.passport.user['sAMAccountName'], 
                
                function(place) {
                    ws.send(JSON.stringify( { 'status': 'queued', 'place': place } ));
                },
                
                function(machine) {
                    // Otherwise let's find them a machine
                    var machine = machines.open(req.session.passport.user['sAMAccountName'], "", 
                    function() {
                        // This handler tells the client that their time is up.
                    });
                    
                    // Exit if there are no free machines. 
                    if(machine == null) {
                        return false;
                    }
                    else {
                        // Get a machine and send details to client
                        var machinelink = "https://lime.egr.uri.edu/Myrtille/?__EVENTTARGET=&__EVENTARGUMENT=&connect=Connect%21&server=" + machine['ip'] + "&domain=ECC&user=" + machine['user'] + "&passwordHash=";
                        ws.send(JSON.stringify( { 'status': 'in-session', 'machine': machine, 'link': machinelink } ));
                        return true;
                    }
                });
            }
            break;
            
            case 'queue-leave': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested queue leave');
                queueworker.remove(req.session.passport.user['sAMAccountName']);
                ws.send(JSON.stringify( { 'status': 'idle' } ));
            }
            break;
            
            
            
            // Session functions
            
            case 'session-end': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested session end');
                machines.close(req.session.passport.user['sAMAccountName']);
                ws.send(JSON.stringify( { 'status': 'idle' } ));
            }
            break;
        }
    })

})





























