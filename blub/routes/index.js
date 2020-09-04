var express = require('express');
var router = express.Router();
var blubsetup = require('../blub_setup.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'ECC Remote', protocol: ((blubsetup.use_tls) ? 'wss://' : 'ws://'), server: blubsetup.host, mini_endpoint: blubsetup.login_endpoint });
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
