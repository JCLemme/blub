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
                sendMachines();
            }
            break;
            
            case 'queue': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested admin queue information');
                var queueinfo = queueworker.debuginfo();
                ws.send(JSON.stringify( { 'status': 'queue-info', 'data': queueinfo } ));
            }
            break;

            case 'terminate': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' wants to terminate user ' + msg['user']);
                worked = machines.terminate(msg['user']);
                console.log(worked + " test!!");
                sendMachines();
            }
            break;

            case 'reserve': {
                cd = (msg['code']) ? "code " + msg['code'] : 'no code';
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' wants to reserve machine ' + msg['machine'] + ' with ' + cd);
                worked = machines.reserve_machine(msg['machine'], msg['code']);
                sendMachines();
            }
            break;

            case 'change-code-all': {
                cd = (msg['code']) ? "reserve all machines with code " + msg['code'] : 'remove all codes from all machines';
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' wants to ' + cd);
                if (msg['code']){
                    changed = machines.reserve(msg['code'], "", true);
                } else {
                    changed = machines.reserve("", "", true);
                }
                sendMachines();
            }
            break;

            case 'remove-code': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' wants to unreserve all machines using code ' + msg['code']);
                changed = machines.reserve("", msg['code']);
                sendMachines();
            }
            break;

            case 'terminate-code': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' wants to terminate all machines using code ' + msg['code']);
                changed = machines.terminateGroup(true, msg['code']);
                sendMachines();
            }
            break;

            case 'terminate-all': {
                console.log('User ' + req.session.passport.user['sAMAccountName'] + ' wants to terminate all machines (something must be very wrong)');
                changed = machines.terminateGroup(false);
                sendMachines();
            }
            break;
        }

        function sendMachines(){
            var machineinfo = machines.debuginfo();
            ws.send(JSON.stringify( { 'status': 'machine-info', 'data': machineinfo } ));
        }
    })

})


