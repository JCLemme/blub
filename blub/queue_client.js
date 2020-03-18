var websocket = require('ws')
var mongodb = require('mongodb')
var queueworker = require('./queue_backend.js')
var machines = require('./machine_backend.js')
var https = require('https')
var remotes = require('./remote_backend.js')
var sockets = require('./socket_backend.js')
var kicker = require('./kicker_backend.js')
var blubsetup = require('./blub_setup.js')

// Queue worker

function queueRunner() {
    console.log("  Another beautiful day in the neighborhood");
    var status = queueworker.nextup();
    
    switch(status) {
        case 'no-machines':
            console.log("    No machines are available to give out")
        break;
        
        case 'queue-empty':
            console.log("    No one's waiting for a machine")
        break;
        
        default:
            console.log("    Looks like " + status + " got a machine")
        break;
    }
    queueworker.save('./queue.json.last');
}




function cullRunner() {
    console.log("  Time to cull the users");
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
    
    machines.save('./machines.json.last');
}


function updateRunner() {
    console.log('Updating at ' + Date.now());
    cullRunner();
    queueRunner();
    console.log(' ');
    setTimeout(updateRunner, 15000);
}

setTimeout(updateRunner, 15000);


// Websocket receiver for clients

wss = new websocket.Server({
    port: blubsetup.client_port,
    
    verifyClient: (info, done) => {
        megasession(info.req, {}, () => {
            done(info.req.session)
        })
    }
});

wss.on('connection', async (ws, req) => {

    // Initialize queue object
    console.log('# New connection from ' + req.session.passport.user['sAMAccountName'] + '...');
    
    ws.on('message', message => {
        console.log(`  ${message}`);
        
        // Parse the message out
        var msg = JSON.parse(message);
        var username = req.session.passport.user['sAMAccountName'] ;
        
        switch(msg['request']) {
            case 'init': {
                // Refresh their websocket
                sockets.register(username, ws);
                
                // See if the user is currently queued, and if so send them some queue
                var place = queueworker.check(username);
                
                if(place != null) {
                    ws.send(JSON.stringify( { 'status': 'queued', 'place': place } ));
                }
                else {
                
                    // See if the user has a machine attached to them
                    var machine = machines.check(username);
                    
                    if(machine != null) {
                        // Split based on class or no class
                        if(machine['on_terminate'] != "") {
                            if(machine['reservation'] != "") {
                                ws.send(JSON.stringify( { 'status': 'in-session-class', 'machine': machine, 'link': remotes.myrtille_link(machine, ""), 'reservation': machine['reservation'] } ));
                            }
                            else {
                                ws.send(JSON.stringify( { 'status': 'in-session', 'machine': machine, 'link': remotes.myrtille_link(machine, "") } ));
                            }
                        }
                        else if(machine['on_kill'] != "") {
                            ws.send(JSON.stringify( { 'status': 'closing', 'machine': machine, 'link': remotes.myrtille_link(machine, "") } ));
                        }
                        else if(machine['on_kill'] == "") {
                            ws.send(JSON.stringify( { 'status': 'idle' } ));
                        }
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
                console.log('  User ' + username + ' requested queue join');
                
                queueworker.append(username, 
                
                function(place) {
                    sockets.send(username, JSON.stringify( { 'status': 'queued', 'place': place } ));
                },
                
                function(machine) {
                    // Otherwise let's find them a machine
                    var machine = machines.open(username, "", 
                    function(machine) {
                        // This handler tells the client that their time is up.
                        console.log('  User ' + username + ' has ten minutes to get their shit together.');
                        kicker.send_message(machine['ip'], username, "Sup boi");
                        sockets.send(username, JSON.stringify( { 'status': 'closing', 'machine': machine, 'link': remotes.myrtille_link(machine, "") } ));
                    },
                    
                    function(machine) {
                        // This handler tells the client to forcibly kill the connection.
                        console.log('  User ' + username + '\'s session just ended.');
                        sockets.send(username, JSON.stringify( { 'status': 'idle' } ));
                    });
                    
                    // Exit if there are no free machines. 
                    if(machine == null) {
                        return false;
                    }
                    else {
                        // Get a machine and send details to client
                        sockets.send(username, JSON.stringify( { 'status': 'in-session', 'machine': machine, 'link': remotes.myrtille_link(machine, "") } ));
                        return true;
                    }
                });
            }
            break;
            
            case 'queue-join-class': {
                console.log('  User ' + username + ' requested to join a class "' + msg['reservation'] + '"');
                
                // Funny enough, there isn't a queue involved. Just look for a machine.
                var available = machines.reservation(msg['reservation']);
                
                if(available == 'class-full') {
                    ws.send(JSON.stringify( { 'status': 'full-class' } ));
                }
                else if(available == 'invalid-class') {
                    ws.send(JSON.stringify( { 'status': 'invalid-class' } ));
                }
                else {
                    console.log('  That class above has ' + available + ' spots left.');
                    
                    var machine = machines.open(username, msg['reservation'], 
                    function(machine) {
                        // This handler tells the client that their time is up.
                        console.log('  User ' + username + ' has ten minutes to get their shit together.');
                        sockets.send(username, JSON.stringify( { 'status': 'closing', 'machine': machine, 'link': remotes.myrtille_link(machine, "") } ));
                    },
                    
                    function(machine) {
                        // This handler tells the client to forcibly kill the connection.
                        console.log('  User ' + username + '\'s session just ended.');
                        sockets.send(username, JSON.stringify( { 'status': 'idle' } ));
                    });
                    
                    if(machine == null) {
                        ws.send(JSON.stringify( { 'status': 'invalid-class' } ));
                    }
                    else {
                        var machinelink = "https://lime.egr.uri.edu/Myrtille/?__EVENTTARGET=&__EVENTARGUMENT=&connect=Connect%21&server=" + machine['ip'] + "&domain=ECC&user=" + machine['user'] + "&passwordHash=";
                        ws.send(JSON.stringify( { 'status': 'in-session-class', 'machine': machine, 'link': machinelink, 'reservation': msg['reservation'] } ));
                    }
                }
            }
            break;
            
            case 'queue-leave': {
                console.log('User ' + username + ' requested queue leave');
                queueworker.remove(username);
                ws.send(JSON.stringify( { 'status': 'idle' } ));
            }
            break;
            
            
            
            // Session functions
            
            case 'session-end': {
                console.log('User ' + username + ' requested session end');
                machines.close(username);
                ws.send(JSON.stringify( { 'status': 'idle' } ));
            }
            break;
        }
    })

})





























