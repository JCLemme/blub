var websocket = require('ws')
var mongodb = require('mongodb')
var queueworker = require('./queue_backend.js')
var machines = require('./machine_backend.js')
var blubsetup = require('./blub_setup.js')

// Websocket receiver for clients

wss = new websocket.Server({
    port: blubsetup.admin_port,
    
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
        
        // Confirm user is part of the right OU.
        // I don't know if Passport is doing this for me but this'll do for now
        if(!req.session.passport.user['memberOf'].includes(blubsetup.ldap_admins)) {
            ws.send(JSON.stringify( { 'status': 'error', 'error': "Invalid user permissions" } ));
            return;
        }
        
        // Else respond to the request
        switch(msg['request']) {
            case 'init-admin': {
                // I don't think there's anything to do here necessarily
            }
            break;
            
            case 'machines': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested admin machine information');
                var machineinfo = machines.debuginfo();
                ws.send(JSON.stringify( { 'status': 'machine-info', 'data': machineinfo } ));
            }
            break;
            
            case 'queue': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested admin queue information');
                var queueinfo = queueworker.debuginfo();
                ws.send(JSON.stringify( { 'status': 'queue-info', 'data': queueinfo } ));
            }
            break;

            case 'reserve': {
                cd = (msg['code']) ? "code " + msg['code'] : 'no code';
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' wants to reserve machine ' + msg['machine'] + ' with ' + cd);
                worked = machines.reserve_machine(msg['machine'], msg['code']);
                //shouldn't hardcode, but send back a refresh signal to update the page automatically
                var machineinfo = machines.debuginfo();
                ws.send(JSON.stringify( { 'status': 'machine-info', 'data': machineinfo } ));
            }
            break;
        }
    })

})


