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
    port: BlubSetup.admin_port,
    
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
        if(msg['endpoint'] == 'admin') {
            var username = req.session.passport.user['sAMAccountName'] ;
            console.log('! Admin message from ' + username + ': ' + `${message}`);
            
            var user = await UserWorker.user_search(username);
            
            switch(msg['request']) {
                case 'init': {
                    // Refresh the login token
                    SessionWorker.register(username, ws);
                }
                break;
                
                case 'machines': {
                    console.log('User ' + username + ' requested admin machine information');
                    sendMachines();
                }
                break;
                
                case 'queue': {
                    console.log('User ' + username + ' requested admin queue information');
                    //var queueinfo = QueueWorker.debuginfo();
                    //SessionWorker.send(username, JSON.stringify( { 'endpoint': 'admin', 'status': 'queue-info', 'data': queueinfo } ));
                }
                break;

                case 'times': {
                    console.log('User ' + username + ' requested session timer information');
                    //var queueinfo = QueueWorker.debuginfo();
                    //SessionWorker.send(username, JSON.stringify( { 'endpoint': 'admin', 'status': 'times-info', 'term': BlubGlobals.data['time-term'], 'kill': BlubGlobals.data['time-kill']} ));
                }
                break;
                
                case 'terminate': {
                    console.log('User ' + username + ' wants to terminate user ' + msg['user']);
                    //worked = MachineWorker.release_machine(user[]);
                    //console.log(worked + " test!!");
                    //sendMachines();
                }
                break;

                case 'reserve': {
                    cd = (msg['code']) ? "code " + msg['code'] : 'no code';
                    console.log('User ' + username + ' wants to reserve machine ' + msg['machine'] + ' with ' + cd);
                    //worked = MachineWorker.reserve_machine(msg['machine'], msg['code']);
                    //sendMachines();
                }
                break;

                case 'change-code-all': {
                    cd = (msg['code']) ? "reserve all machines with code " + msg['code'] : 'remove all codes from all machines';
                    console.log('User ' + username + ' wants to ' + cd);
                    //if (msg['code']){
                    //    changed = MachineWorker.reserve(msg['code'], "", true);
                    //} else {
                    //    changed = MachineWorker.reserve("", "", true);
                    //}
                    //sendMachines();
                }
                break;

                case 'remove-code': {
                    console.log('User ' + username + ' wants to unreserve all machines using code ' + msg['code']);
                    //changed = MachineWorker.reserve("", msg['code']);
                    //sendMachines();
                }
                break;

                case 'terminate-code': {
                    console.log('User ' + username + ' wants to terminate all machines using code ' + msg['code']);
                    //changed = MachineWorker.terminateGroup(true, msg['code']);
                    //sendMachines();
                }
                break;

                case 'terminate-all': {
                    console.log('User ' + username + ' wants to terminate all machines (something must be very wrong)');
                    //changed = MachineWorker.terminateGroup(false);
                    //sendMachines();
                }
                break;
                
                case 'change-length': {
                    console.log('Changing session length to ' + msg['num'] + ' minutes');
                    //BlubGlobals.data['time-term'] = Number(msg['num']);
                }
                break;
              
                case 'change-grace': {
                    console.log('Changing logout time to ' + msg['num'] + ' minutes');
                    //BlubGlobals.data['time-kill'] = Number(msg['num']);
                }
                break;
                
                function sendMachines(){
                    //var machineinfo = MachineWorker.debuginfo();
                    //SessionWorker.send(username, JSON.stringify( { 'endpoint': 'admin', 'status': 'machine-info', 'data': machineinfo } ));
                }
            }
        }
    })

})





























