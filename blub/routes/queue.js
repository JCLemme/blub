var express = require('express');
var router = express.Router();
var websocket = require('ws')


/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        res.render('queue', { title: 'Blub queue' });
    }
    else {
        res.redirect('/login');
    }
});



// Below is the important bits

wss = new websocket.Server({
    port: 8080,
    
    verifyClient: (info, done) => {
        megasession(info.req, {}, () => {
            done(info.req.session)
        })
    }
});

wss.on('connection', (ws, req) => {

    var messages = [];
    
    ws.on('message', message => {
        console.log(`${message}`);
        
        // Parse the message out
        msg = JSON.parse(message);
        
        switch(msg['request']) {
            case 'queue-join': {
                console.log('User requested queue join');
                console.log(req.session.passport.user);
            }
            break;
            
            case 'queue-leave': {
                console.log('User requested queue leave');
            }
            break;
        }
    })

    ws.send('Hello! Message From Server!!');

})



module.exports = router;
