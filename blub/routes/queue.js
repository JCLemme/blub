var express = require('express');
var router = express.Router();

var blubsetup = require('../blub_setup.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        res.render('queue', { title: 'ECC queue', protocol: ((blubsetup.use_tls) ? 'wss://' : 'ws://'), server: blubsetup.host, endpoint: blubsetup.queue_endpoint, mini_endpoint: blubsetup.login_endpoint });
    }
    else {
        res.redirect('/login');
    }
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
