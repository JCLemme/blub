var websocket = require('ws')
var https = require('https')

var QueueWorker = require('@workers/queue_backend')
var MachineWorker = require('@workers/machine_backend')
var RemoteConnectionWorker = require('@workers/remote_backend')
var SessionWorker = require('@workers/socket_backend')

var BlubSetup = require('@root/blub_setup')

// Queue worker

function queueRunner() {
    console.log("  Another beautiful day in the neighborhood");
    var status = QueueWorker.nextup();
    
    switch(status) {
        case 'no-machines':
            console.log("    No machines are available to give out")
        break;
        
        case 'queue-empty':
            console.log("    No one's waiting for a machine")
        break;
        
        default:
            console.log("    Looks like " + status + " got a machine")
        break;
    }
    
    QueueWorker.save(BlubSetup.queue_default + '.last');
}

function cullRunner() {
    console.log("  Time to cull the users");
    var status = MachineWorker.cull("");
    
    MachineWorker.save(BlubSetup.machines_default + '.last');
}


function updateRunner() {
    console.log('\nUpdating at ' + Date.now());
    cullRunner();
    
    for(var q=0;q<BlubSetup.max_queue_per_turn;q++) {
        queueRunner();
    }
    
    console.log(' ');
    setTimeout(updateRunner, BlubSetup.runner_delay*1000);
}

setTimeout(updateRunner, BlubSetup.runner_delay*1000);


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
        
        
        if(msg['endpoint'] == 'queue') {
            var username = req.session.passport.user['sAMAccountName'] ;
            console.log('! Queue message from ' + username + ': ' + `${message}`);
            
            switch(msg['request']) {
                case 'init': {
                    // Refresh their websocket
                    SessionWorker.register(username, ws);
                    
                    // See if the user is currently queued, and if so send them some queue
                    var place = QueueWorker.check(username);
                    
                    if(place != null) {
                        ws.send(JSON.stringify( { 'endpoint': 'queue', 'status': 'queued', 'place': place } ));
                    }
                    else {
                    
                        // See if the user has a machine attached to them
                        var machine = MachineWorker.check(username);
                        
                        if(machine != null) {
                            // Split based on class or no class
                            if(machine['on_terminate'] != "") {
                                if(machine['reservation'] != "") {
                                    ws.send(JSON.stringify( { 'endpoint': 'queue', 'status': 'in-session-class', 'machine': machine, 'myrtille-link': RemoteConnectionWorker.myrtille_link(machine, ""), 'rdp-file': RemoteConnectionWorker.rdp_file(machine), 'reservation': machine['reservation'] } ));
                                }
                                else {
                                    ws.send(JSON.stringify( { 'endpoint': 'queue', 'status': 'in-session', 'machine': machine, 'myrtille-link': RemoteConnectionWorker.myrtille_link(machine, ""), 'rdp-file': RemoteConnectionWorker.rdp_file(machine) } ));
                                }
                            }
                            else if(machine['on_kill'] != "") {
                                ws.send(JSON.stringify( { 'endpoint': 'queue', 'status': 'closing', 'machine': machine, 'myrtille-link': RemoteConnectionWorker.myrtille_link(machine, ""), 'rdp-file': RemoteConnectionWorker.rdp_file(machine) } ));
                            }
                            else if(machine['on_kill'] == "") {
                                ws.send(JSON.stringify( { 'endpoint': 'queue', 'status': 'idle' } ));
                            }
                        }
                        else {
                        
                            // User must not be doing anything I guess.
                            ws.send(JSON.stringify( { 'endpoint': 'queue', 'status': 'idle' } ));
                        }
                    }
                }
                break;
                
                // Queue functions

                case 'queue-join': {
                    console.log('  User ' + username + ' requested queue join');
                    
                    QueueWorker.append(username, 
                    
                    function(place) {
                        var wait = MachineWorker.time_at(place);
                        SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'queued', 'place': place, 'wait': wait } ));
                    },
                    
                    function(machine) {
                        // Otherwise let's find them a machine
                        var machine = MachineWorker.open(username, "", 
                        function(machine) {
                            // This handler tells the client that their time is up.
                            console.log('  User ' + username + ' has ten minutes to get their shit together.');
                            SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'closing', 'machine': machine, 'myrtille-link': RemoteConnectionWorker.myrtille_link(machine, ""), 'rdp-file': RemoteConnectionWorker.rdp_file(machine) } ));
                        },
                        
                        function(machine) {
                            // This handler tells the client to forcibly kill the connection.
                            console.log('  User ' + username + '\'s session just ended.');
                            SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'idle' } ));
                        });
                        
                        // Exit if there are no free machines. 
                        if(machine == null) {
                            return false;
                        }
                        else {
                            // Get a machine and send details to client
                            SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'in-session', 'machine': machine, 'myrtille-link': RemoteConnectionWorker.myrtille_link(machine, ""), 'rdp-file': RemoteConnectionWorker.rdp_file(machine) } ));
                            return true;
                        }
                    });
                }
                break;
                
                case 'queue-join-class': {
                    console.log('  User ' + username + ' requested to join a class "' + msg['reservation'] + '"');
                    
                    // Funny enough, there isn't a queue involved. Just look for a machine.
                    var available = MachineWorker.reservation(msg['reservation']);
                    
                    if(available == 'class-full') {
                        SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'full-class' } ));
                    }
                    else if(available == 'invalid-class') {
                        SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'invalid-class' } ));
                    }
                    else {
                        console.log('  That class above has ' + available + ' spots left.');
                        
                        var machine = MachineWorker.open(username, msg['reservation'], 
                        function(machine) {
                            // This handler tells the client that their time is up.
                            console.log('  User ' + username + ' has ten minutes to get their shit together.');
                            SessionWorker.send(username, JSON.stringify({'endpoint': 'computer', 'action': 'notify-user', 'message': 'Your session is expiring soon. Please save all work and leave the remote session.'}));
                            SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'closing', 'machine': machine, 'myrtille-link': RemoteConnectionWorker.myrtille_link(machine, ""), 'rdp-file': RemoteConnectionWorker.rdp_file(machine) } ));
                        },
                        
                        function(machine) {
                            // This handler tells the client to forcibly kill the connection.
                            console.log('  User ' + username + '\'s session just ended.');
                            SessionWorker.send(username, JSON.stringify({'endpoint': 'computer', 'action': 'notify-user', 'message': 'Your session is over. You will be logged out in thirty seconds.'}));
                            SessionWorker.send(username, JSON.stringify({'endpoint': 'computer', 'action': 'kill-session', 'timer': 30}));
                            SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'idle' } ));
                        });
                        
                        if(machine == null) {
                            SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'invalid-class' } ));
                        }
                        else {
                            SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'in-session-class', 'machine': machine, 'reservation': msg['reservation'], 'myrtille-link': RemoteConnectionWorker.myrtille_link(machine, ""), 'rdp-file': RemoteConnectionWorker.rdp_file(machine)  } ));
                        }
                    }
                }
                break;
                
                case 'queue-leave': {
                    console.log('User ' + username + ' requested queue leave');
                    QueueWorker.remove(username);
                    SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'idle' } ));
                }
                break;
                         
                // Session functions
                
                case 'session-end': {
                    console.log('User ' + username + ' requested session end');
                    MachineWorker.close(username);
                    SessionWorker.send(username, JSON.stringify( { 'endpoint': 'queue', 'status': 'idle' } ));
                }
                break;
            }
        }
        
        else if(msg['endpoint'] == 'login') {
            switch(msg['request']) {
                case 'session-passwd': {
                    console.log("Beep boop password store");
                    SessionWorker.pass(msg['user'], msg['pass']);
                    var phash = RemoteConnectionWorker.myrtille_hash(msg['pass'], function(phash) {
                        ws.send(JSON.stringify( { 'endpoint': 'login', 'status': 'passwd-hash', 'hash': phash } ));
                    });
                }
                break;
                
                // User data functions
                
                case 'user-info': {
                    if (req.session.passport != null){
                        if (req.session.passport.user != null){
                            console.log('User ' + req.session.passport.user['sAMAccountName'] + ' requested all their info');
                            ws.send(JSON.stringify( { 'endpoint': 'login', 'response': 'info',  'data': req.session.passport.user} ));
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
                    
                    var machine = MachineWorker.check(req.session.passport.user['sAMAccountName']);
                    
                    if(machine == null) {
                        ws.send(JSON.stringify({'status': 'error', 'error': 'no-session'}));
                    }
                    else{
                        var newrdp = {
                            "connection": {
                                "type": "rdp",
                                "settings": {
                                    "hostname": machine['ip'],
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
                        
                        console.log(newrdp);
                        
                        var token = encrypt(newrdp);
                        ws.send(JSON.stringify({'status': 'rdp-token', 'token': token}));
                    }
                }
                break;
            }
        }
        
        else if(msg['endpoint'] == 'admin') {
            var username = req.session.passport.user['sAMAccountName'] ;
            console.log('! Admin message from ' + username + ': ' + `${message}`);
            
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
                    var queueinfo = QueueWorker.debuginfo();
                    SessionWorker.send(username, JSON.stringify( { 'endpoint': 'admin', 'status': 'queue-info', 'data': queueinfo } ));
                }
                break;

                case 'terminate': {
                    console.log('User ' + username + ' wants to terminate user ' + msg['user']);
                    worked = MachineWorker.terminate(msg['user']);
                    console.log(worked + " test!!");
                    sendMachines();
                }
                break;

                case 'reserve': {
                    cd = (msg['code']) ? "code " + msg['code'] : 'no code';
                    console.log('User ' + username + ' wants to reserve machine ' + msg['machine'] + ' with ' + cd);
                    worked = MachineWorker.reserve_machine(msg['machine'], msg['code']);
                    sendMachines();
                }
                break;

                case 'change-code-all': {
                    cd = (msg['code']) ? "reserve all machines with code " + msg['code'] : 'remove all codes from all machines';
                    console.log('User ' + username + ' wants to ' + cd);
                    if (msg['code']){
                        changed = MachineWorker.reserve(msg['code'], "", true);
                    } else {
                        changed = MachineWorker.reserve("", "", true);
                    }
                    sendMachines();
                }
                break;

                case 'remove-code': {
                    console.log('User ' + username + ' wants to unreserve all machines using code ' + msg['code']);
                    changed = MachineWorker.reserve("", msg['code']);
                    sendMachines();
                }
                break;

                case 'terminate-code': {
                    console.log('User ' + username + ' wants to terminate all machines using code ' + msg['code']);
                    changed = MachineWorker.terminateGroup(true, msg['code']);
                    sendMachines();
                }
                break;

                case 'terminate-all': {
                    console.log('User ' + username + ' wants to terminate all machines (something must be very wrong)');
                    changed = MachineWorker.terminateGroup(false);
                    sendMachines();
                }
                break;
                
                function sendMachines(){
                    var machineinfo = MachineWorker.debuginfo();
                    SessionWorker.send(username, JSON.stringify( { 'endpoint': 'admin', 'status': 'machine-info', 'data': machineinfo } ));
                }
            }
        }
        
        else if(msg['endpoint'] == 'computer') {
            console.log('testing A');
            switch(msg['request']) {
                case 'watchdog': {
                    // The computer is valid
                    console.log('testing B');
                    SessionWorker.watchdog_connection(msg['user'], ws);
                    SessionWorker.send_watchdog(msg['user'], JSON.stringify({'endpoint': 'computer', 'action': 'watchdog'}));
                    //ws.send(JSON.stringify({'endpoint': 'computer', 'action': 'notify-user', 'message': 'fuck you'}));
                    //ws.send(JSON.stringify({'endpoint': 'computer', 'action': 'kill-session', 'timer': 15}));
                }
            }
        }

    })

})





























