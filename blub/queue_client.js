var websocket = require('ws')
var mongodb = require('mongodb')
var queueworker = require('./queue_backend.js')

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
                    ws.send(JSON.stringify( { 'status': 'idle' } ));
                }
            }
            break;
            
            case 'queue-join': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested queue join');
                
                queueworker.append(req.session.passport.user['sAMAccountName'], 
                
                function(place) {
                    console.log('In place ' + place);
                    ws.send(JSON.stringify( { 'status': 'queued', 'place': place } ));
                },
                
                function() {
                    console.log("I'm up");
                });
            }
            break;
            
            case 'queue-leave': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested queue leave');
                queueworker.remove(req.session.passport.user['sAMAccountName']);
                ws.send(JSON.stringify( { 'status': 'idle' } ));
            }
            break;
        }
    })

    ws.send('Hello! Message From Server!!');

})


