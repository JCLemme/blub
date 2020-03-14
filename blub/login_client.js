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
        }
    })

})





























