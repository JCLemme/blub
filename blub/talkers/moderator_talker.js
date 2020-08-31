var websocket = require('ws')
var https = require('https')

var UserWorker = require('@workers/user_worker')
var MachineWorker = require('@workers/machine_worker')
var RemoteConnectionWorker = require('@workers/remote_worker')
var SessionWorker = require('@workers/session_worker')

var BlubSetup = require('@root/blub_setup')
var BlubGlobals = require('@root/blub_globals.js')

// Websocket receiver for clients

wss = new websocket.Server({
    port: BlubSetup.moderator_port,
    
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
        
        
    ws.on('message', async message => {
            
        // Parse the message out
        var msg = JSON.parse(message);
        
        // V dangerous
        //console.log(msg);
        if(msg['endpoint'] == 'moderator') {
            var username = req.session.passport.user['sAMAccountName'] ;
            console.log('! Moderator message from ' + username + ': ' + `${message}`);
            
            var user = await UserWorker.user_search(username);
            
            switch(msg['request']) {
                case 'init': {
                
                    // Refresh the login token
                    SessionWorker.register(username, ws);
                }
                break;
                
            }
        }
    })

})





























