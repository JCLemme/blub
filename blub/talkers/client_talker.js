var websocket = require('ws')
var https = require('https')

var QueueWorker = require('@workers/queue_worker')
var MachineWorker = require('@workers/machine_worker')
var RemoteConnectionWorker = require('@workers/remote_worker')
var SessionWorker = require('@workers/session_worker')

var BlubSetup = require('@root/blub_setup')
var BlubGlobals = require('@root/blub_globals.js')

// Websocket receiver for clients

wss = new websocket.Server({
    port: BlubSetup.client_port,
    
    verifyClient: (info, done) => {
        megasession(info.req, {}, () => {
            done(info.req.session)
        })
    }
});

wss.on('connection', async (ws, req) => {

    // Initialize queue object
    if(req.session.passport != null){
        if(req.session.passport.user != null){
            console.log('# New connection from ' + req.session.passport.user['sAMAccountName'] + '...');
        } else {
            console.log('# New connection from unauthenticated user...');
        }
    } else {
        console.log('# New connection from unauthenticated user...');
    }
        
        
    ws.on('message', message => {
            
        // Parse the message out
        var msg = JSON.parse(message);
        
        // V dangerous
        //console.log(msg);
        if(msg['endpoint'] == 'computer') {
            switch(msg['request']) {
                case 'watchdog': {
                    SessionWorker.watchdog_connection(msg['user'], ws);
                    
                    console.log('Checking connection state for user ' + msg['user'] + ' on machine ' + msg['host']);
                    var machine = MachineWorker.check(msg['user']);
                    
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
        }
    })

})





























