var websocket = require('ws')
var mongodb = require('mongodb')
var queueworker = require('./queue_backend.js')
var machines = require('./machine_backend.js')
var {https} = require('follow-redirects')
var remotes = require('./remote_backend.js')

var blubsetup = require('./blub_setup.js')

// Websocket receiver for clients

wss = new websocket.Server({
    port: blubsetup.login_port,
    
    verifyClient: (info, done) => {
        megasession(info.req, {}, () => {
            done(info.req.session)
        })
    }
});

wss.on('connection', async (ws, req) => {
    
    ws.on('message', message => {
        // Parse the message out
        msg = JSON.parse(message);
        console.log(msg);
        
        switch(msg['request']) {
            
            case 'session-passwd': {
                console.log("Beep boop hash request");
                var phash = remotes.myrtille_hash(msg['pass'], function(phash) {
                    ws.send(JSON.stringify( { 'status': 'passwd-hash', 'hash': phash } ));
                });
            }
            break;
            
            


            // User data functions
            
            case 'user-info': {
                if (req.session.passport != null){
                    if (req.session.passport.user != null){
                        console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested all their info');
                        ws.send(JSON.stringify( { 'response': 'info',  'data': req.session.passport.user} ));
                    }else{
                        console.log("User-info request was made but no user is logged in, sending logged-out message");
                        ws.send(JSON.stringify( { 'response': 'info',  'data': 'none'} ));
                    }
                }else{
                    console.log("User-info request was made but no user is logged in, sending logged-out message");
                    ws.send(JSON.stringify( { 'response': 'info',  'data': 'none'} ));
                }
            }
            break;
            
            
            
            
            
            case 'guac-encrypt': {
            
                const crypto = require('crypto');
                 
                const clientOptions = {
                    cypher: 'AES-256-CBC',
                    key: blubsetup.guac_key,
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
                
                var token = encrypt(msg['token']);
                ws.send(JSON.stringify({'status': 'rdp-token', 'token': token}));
            }
            break;
        }
    })

})





























