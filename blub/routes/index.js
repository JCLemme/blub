var express = require('express');
var router = express.Router();
var blubsetup = require('../blub_setup.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Blub @ the ECC', client_server: "wss://" + blubsetup.host + ':' + blubsetup.client_port_external  });
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
