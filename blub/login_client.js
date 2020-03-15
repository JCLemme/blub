var websocket = require('ws')
var mongodb = require('mongodb')
var queueworker = require('./queue_backend.js')
var machines = require('./machine_backend.js')
var {https} = require('follow-redirects')

// Websocket receiver for clients

wss = new websocket.Server({
    port: 8082,
    
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
                
                https.get("https://lime.egr.uri.edu/myrtille/GetHash.aspx?password=" + encodeURIComponent(msg['pass']), {rejectUnauthorized: false}, res => {
                    res.setEncoding("utf8");
                    
                    let phash = "";
                    
                    res.on("data", data => {
                        phash += data;
                    });
                    
                    res.on("end", () => {
                        console.log("Generated hash " + phash);
                        
                        ws.send(JSON.stringify( { 'status': 'passwd-hash', 'hash': phash } ));
                    });
                });
            }
            break;
            
            case 'guac-encrypt': {
            
                const crypto = require('crypto');
                 
                const clientOptions = {
                    cypher: 'AES-256-CBC',
                    key: 'MySuperSecretKeyForParamsToken12'
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





























