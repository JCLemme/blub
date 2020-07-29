var websocket = require('ws')
var https = require('https')
var logs = require('pino')().child({'source': 'machine-talker'})

var BlubSetup = require('@root/blub_setup')
var BlubGlobals = require('@root/blub_globals.js')

var QueueWorker = require('@workers/queue_worker')
var MachineWorker = require('@workers/machine_worker')
var RemoteConnectionWorker = require('@workers/remote_worker')
var SessionWorker = require('@workers/session_worker')


/*
 *    _
 *   /. \ /|    blub
 *  (_   X |    
 *   \_V/ \|    copyright 2020- john lemme and co
 * 
 */


wss = new websocket.Server({
    port: BlubSetup.ws_port_client,
    
    verifyClient: (info, done) => {
        megasession(info.req, {}, () => {
            done(info.req.session)
        })
    }
});

wss.on('connection', async (ws, req) => {

    // Check to see if the connection is bound to an authenticated user
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
            
        // Parse the message out
        var msg = JSON.parse(message);
        
        switch(msg['request']) {
            case 'watchdog': {
            
                // Replace the user's watchdog socket with this one, since it's clearly the one they want to use
                SessionWorker.watchdog_connection(msg['user'], ws);
                
                logs.info('Checking connection state for user ' + msg['user'] + ' on machine ' + msg['host']);
                var machine = UserWorker.check(msg['user']);
                
                if(machine == null) {
                    console.log('They are gettin banned');
                    SessionWorker.send_watchdog(msg['user'], JSON.stringify({'endpoint': 'computer', 'action': 'watchdog-fail', 'error': 'no-session'}));
                }
                else {
                    if(machine['name'].toUpperCase() != msg['host'].toUpperCase())
                        SessionWorker.send_watchdog(msg['user'], JSON.stringify({'endpoint': 'computer', 'action': 'watchdog-fail', 'error': 'invalid-host'}));
                    else
                        SessionWorker.send_watchdog(msg['user'], JSON.stringify({'endpoint': 'computer', 'action': 'watchdog-success'}));
                }
            }
            break;
        }
    })

})





