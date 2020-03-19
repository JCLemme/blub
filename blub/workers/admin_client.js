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
            
        }

        function sendMachines(){
            var machineinfo = machines.debuginfo();
            ws.send(JSON.stringify( { 'status': 'machine-info', 'data': machineinfo } ));
        }
    })

})


