var websocket = require('ws')
var https = require('https')
var logs = require('pino')().child({'source': 'queue-talker'})

var UserWorker = require('@workers/user_worker')
var MachineWorker = require('@workers/machine_worker')
var RemoteConnectionWorker = require('@workers/remote_worker')
var SessionWorker = require('@workers/session_worker')

var BlubSetup = require('@root/blub_setup')
var BlubGlobals = require('@root/blub_globals.js')

/*
 *    _
 *   /. \ /|    blub
 *  (_   X |    
 *   \_V/ \|    copyright 2020- john lemme and co
 * 
 */

wss = new websocket.Server({   
    port: BlubSetup.queue_port,
    
    verifyClient: (info, done) => {
        megasession(info.req, {}, () => {
            done(info.req.session)
        })
    }
});

wss.on('connection', async (ws, req) => {

    // Authenticate the connection
    if(req.session.passport != null){
        if(req.session.passport.user != null){
            logs.info('New connection from ' + req.session.passport.user['sAMAccountName'] + '...');
        } else {
            logs.info('New connection from unauthenticated user...');
        }
    } else {
        logs.info('New connection from unauthenticated user...');
    }
        
    ws.on('message', message => {
            
        // Convert the message from JSON
        var msg = JSON.parse(message);
    
        // Get username from Passport
        var username = req.session.passport.user['sAMAccountName'] ;

        // Callbacks for queue and machine calls. I don't know if there's a better place
        // to put them but for now here is fine

        var callback_session_term = function(machine) {
            // This handler tells the client that their time is up.
            console.log('  User ' + username + ' has ten minutes to get their shit together.');
            SessionWorker.send_watchdog(username, JSON.stringify({ 'action': 'notify-user', 'message': 'Your session is expiring soon. Please save all work and leave the remote session.'}));
            SessionWorker.send(username, JSON.stringify( { 'status': 'closing', 'machine': machine } ));
        }

        var callback_session_kill = function(machine) {
            // This handler tells the client to forcibly kill the connection.
            console.log('  User ' + username + '\'s session just ended.');
            SessionWorker.send_watchdog(username, JSON.stringify({ 'action': 'notify-user', 'message': 'Your session is over. You will be logged out in thirty seconds.'}));
            SessionWorker.send_watchdog(username, JSON.stringify({ 'action': 'kill-session', 'timer': 30}));
            SessionWorker.send(username, JSON.stringify( { 'status': 'idle' } ));
        }


        // WHY DO YOU CALL UPON ME
        switch(msg['request']) {
        
            // Initalize the connection and synchronize states between blub and the client's browser
            case 'init': {
            
                // Refresh the websocket they're using
                SessionWorker.register(username, ws);
                
                // Grab their userobject
                var user = UserWorker.user_search(username);
                
                if(user == false) {
                
                    // Users are added to Blub at login, so we should not get here
                    ws.send(JSON.stringify( { 'status': 'error', 'error': 'user-not-in-database' } ));
                }
                else {
                    
                    // Does the user have a machine?
                    if(user['machine'] != null) {
                        
                        // Is the user in a classroom?
                        if(user['reservation'] != "") {
                            ws.send(JSON.stringify( { 'status': 'in-session-class', 'machine': machine, 'reservation': user['reservation'] } ));
                        }
                        else {
                            ws.send(JSON.stringify( { 'status': 'in-session', 'machine': machine } ));
                    }
                }
                
                if(place != null) {
                    ws.send(JSON.stringify( { 'status': 'queued', 'place': place } ));
                }
                else {
                
                    // See if the user has a machine attached to them
                    var machine = MachineWorker.check(username);
                    
                    if(machine != null) {
                        // Split based on class or no class
                        if(machine['on_terminate'] != "") {
                            if(machine['reservation'] != "") {
                                ws.send(JSON.stringify( { 'status': 'in-session-class', 'machine': machine, 'reservation': machine['reservation'] } ));
                            }
                            else {
                                ws.send(JSON.stringify( { 'status': 'in-session', 'machine': machine } ));
                            }
                        }
                        else if(machine['on_kill'] != "") {
                            ws.send(JSON.stringify( { 'status': 'closing', 'machine': machine } ));
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
            
            // Queue functions

            case 'queue-join': {
                console.log('  User ' + username + ' requested queue join');
                
            }
            break;
            
            case 'queue-join-class': {
                console.log('  User ' + username + ' requested to join a class "' + msg['reservation'] + '"');
                
                // Funny enough, there isn't a queue involved. Just look for a machine.
                var available = MachineWorker.reservation(msg['reservation']);
                
                if(available == 'class-full') {
                    SessionWorker.send(username, JSON.stringify( { 'status': 'full-class' } ));
                }
                else if(available == 'invalid-class') {
                    SessionWorker.send(username, JSON.stringify( { 'status': 'invalid-class' } ));
                }
                else {
                    console.log('  That class above has ' + available + ' spots left.');
                    
                    var machine = MachineWorker.open(username, msg['reservation'], callback_session_term, callback_session_kill);
                    
                    if(machine == null) {
                        SessionWorker.send(username, JSON.stringify( { 'status': 'invalid-class' } ));
                    }
                    else {
                        SessionWorker.send(username, JSON.stringify( { 'status': 'in-session-class', 'machine': machine, 'reservation': msg['reservation'] } ));
                    }
                }
            }
            break;
            
            case 'queue-leave': {
                console.log('User ' + username + ' requested queue leave');
                QueueWorker.remove(username);
                SessionWorker.send(username, JSON.stringify( { 'status': 'idle' } ));
            }
            break;
                     
            // Session functions
            
            case 'run-myrtille': {
                var machine = MachineWorker.check(username);
                
                if(machine != null) {
                    var phash = RemoteConnectionWorker.myrtille_hash(SessionWorker.credentials(username), function(phash) {
                        SessionWorker.send(username, JSON.stringify( { 'status': 'launch-myrtille', 'link': RemoteConnectionWorker.myrtille_link(machine, phash), } ));
                    });
                }
                else {
                    SessionWorker.send(username, JSON.stringify( { 'status': 'error', 'reason': 'no-machine'  } ));
                }
            }
            break;
            
            case 'run-rdp': {
                var machine = MachineWorker.check(username);
                
                if(machine != null) {
                    SessionWorker.send(username, JSON.stringify( { 'status': 'launch-rdp', 'file': RemoteConnectionWorker.rdp_file(machine) } ));
                }
                else {
                    SessionWorker.send(username, JSON.stringify( { 'status': 'error', 'reason': 'no-machine'  } ));
                }
            }
            break;
            
            case 'session-end': {
                console.log('User ' + username + ' requested session end');
                MachineWorker.terminate(username);
                MachineWorker.terminate(username);
                SessionWorker.send(username, JSON.stringify( { 'status': 'idle' } ));
            }
            break;
        }
    })

})





























