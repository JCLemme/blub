var express = require('express');
var router = express.Router();

var blubsetup = require('../blub_setup.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        res.render('queue', { title: 'Blub queue', client_server: "ws://" + blubsetup.host + ':' + blubsetup.client_port_external   });
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
