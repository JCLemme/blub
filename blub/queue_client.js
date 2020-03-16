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
}




function cullRunner() {
    console.log("Time to die");
    var status = machines.cull();
    
    /*switch(status) {
        case 'no-machines':
            console.log("  No machines are available to give out")
        break;
        
        case 'queue-empty':
            console.log("  No one's waiting for a machine")
        break;
        
        default:
            console.log("  Looks like " + status + " got a machine")
        break;
    }*/
}


function updateRunner() {
    cullRunner();
    queueRunner();
    setTimeout(updateRunner, 15000);
}

setTimeout(updateRunner, 15000);


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
                        console.log('User ' + req.session.passport.user['sAMAccountName'] + ' has ten minutes to get their shit together.');
                        ws.send(JSON.stringify( { 'status': 'closing' } ));
                    },
                    
                    function() {
                        // This handler tells the client to forcibly kill the connection.
                        console.log('User ' + req.session.passport.user['sAMAccountName'] + '\'s session just ended.');
                        ws.send(JSON.stringify( { 'status': 'idle' } ));
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
            
            case 'queue-join-class': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested to join a class "' + msg['reservation'] + '"');
                
                // Funny enough, there isn't a queue involved. Just look for a machine.
                var available = machines.reservation(msg['reservation']);
                
                if(available == 'class-full') {
                    ws.send(JSON.stringify( { 'status': 'full-class' } ));
                }
                else if(available == 'invalid-class') {
                    ws.send(JSON.stringify( { 'status': 'invalid-class' } ));
                }
                else {
                    console.log('That class above has ' + available + ' spots left.');
                    
                    var machine = machines.open(req.session.passport.user['sAMAccountName'], msg['reservation'], 
                    function() {
                        // This handler tells the client that their time is up.
                        console.log('User ' + req.session.passport.user['sAMAccountName'] + ' has ten minutes to get their shit together.');
                        ws.send(JSON.stringify( { 'status': 'closing' } ));
                    },
                    
                    function() {
                        // This handler tells the client to forcibly kill the connection.
                        console.log('User ' + req.session.passport.user['sAMAccountName'] + '\'s session just ended.');
                        ws.send(JSON.stringify( { 'status': 'idle' } ));
                    });
                    
                    if(machine == null) {
                        ws.send(JSON.stringify( { 'status': 'invalid-class' } ));
                    }
                    else {
                        var machinelink = "https://lime.egr.uri.edu/Myrtille/?__EVENTTARGET=&__EVENTARGUMENT=&connect=Connect%21&server=" + machine['ip'] + "&domain=ECC&user=" + machine['user'] + "&passwordHash=";
                        ws.send(JSON.stringify( { 'status': 'in-session-class', 'machine': machine, 'link': machinelink, 'reservation': msg['reservation'] } ));
                    }
                }
                
                queueworker.append(req.session.passport.user['sAMAccountName'], 
                
                function(place) {
                    ws.send(JSON.stringify( { 'status': 'queued', 'place': place } ));
                },
                
                function(machine) {
                    // Otherwise let's find them a machine
                    var machine = machines.open(req.session.passport.user['sAMAccountName'], "", 
                    function() {
                        // This handler tells the client that their time is up.
                        console.log('User ' + req.session.passport.user['sAMAccountName'] + ' has ten minutes to get their shit together.');
                        ws.send(JSON.stringify( { 'status': 'closing' } ));
                    },
                    
                    function() {
                        // This handler tells the client to forcibly kill the connection.
                        console.log('User ' + req.session.passport.user['sAMAccountName'] + '\'s session just ended.');
                        ws.send(JSON.stringify( { 'status': 'idle' } ));
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





























