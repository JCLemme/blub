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
    port: BlubSetup.login_port,
    
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
        if(msg['endpoint'] == 'login') {
            switch(msg['request']) {
                case 'session-passwd': {
                    console.log("Beep boop password store");
                    SessionWorker.pass(msg['user'], msg['pass']);
                    ws.send(JSON.stringify( { 'response': 'ready' } ));
                }
                break;
                
                // User data functions
                
                case 'user-info': {
                    if (req.session.passport != null){
                        if (req.session.passport.user != null){
                            console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested all their info');
                            ws.send(JSON.stringify( { 'endpoint': 'login', 'response': 'info',  'data': req.session.passport.user, 'check1': BlubSetup.ldap_admins, 'check2': BlubSetup.ldap_moderators} ));
                        }else{
                            console.log("User-info request was made but no user is logged in, sending logged-out message");
                            ws.send(JSON.stringify( { 'endpoint': 'login', 'response': 'info',  'data': 'none'} ));
                        }
                    }else{
                        console.log("User-info request was made but no user is logged in, sending logged-out message");
                        ws.send(JSON.stringify( { 'endpoint': 'login', 'response': 'info',  'data': 'none'} ));
                    }
                }
                break;

                case 'guac-token': {
                
                    const crypto = require('crypto');
                     
                    const clientOptions = {
                        cypher: 'AES-256-CBC',
                        key: BlubSetup.guac_key,
                    }
                     
                    const encrypt = (value) => {
                        const iv = crypto.randomBytes(16);
                        const cipher = crypto.createCipheriv(clientOptions.cypher, clientOptions.key, iv);
                     
                        let crypted = cipher.update(JSON.stringify(value), 'utf8', 'base64');
                        crypted += cipher.final('base64');
                     
                        const data = {
                            iv: iv.toString('base64'),
                            value: crypted
                        };
                     
                        return new Buffer(JSON.stringify(data)).toString('base64');

                    };
                    
                    
                    // Runnin shit bouiz
                    var user = await UserWorker.user_search(req.session.passport.user['sAMAccountName']);

                    if(user == false) {
                        // If the user is not logged in
                        ws.send(JSON.stringify({'status': 'error', 'error': 'no-session'}));
                        // We'll just send no session again. They shouldn't be able to get here anyway without being logged in so...
                    }
                    else if(user['machine'] == null) {
                        // If the user actually does not have a machine and was lying to us
                        ws.send(JSON.stringify({'status': 'error', 'error': 'no-session'}));
                    }
                    else {
                        var machine = await MachineWorker.get_machine(user['machine']);

                        var newrdp = {
                            "connection": {
                                "type": "rdp",
                                "settings": {
                                    "hostname": machine['host'],
                                    "username": machine['user'],
                                    "password": SessionWorker.credentials(machine['user']),
                                    "security": "any",
                                    "ignore-cert": true,
                                    "enable-wallpaper": true,
                                    "width": msg['width'],
                                    "height": msg['height'],
                                }
                            }
                        }
                        
                        
                        var token = encrypt(newrdp);
                        ws.send(JSON.stringify({'status': 'rdp-token', 'token': token}));
                    }
                }
                break;
            }
        }
    })

})





























