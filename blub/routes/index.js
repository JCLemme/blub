var express = require('express');
var router = express.Router();
var blubsetup = require('./blub_setup.js')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', uname_server: "ws://" + blubsetup.host + ':' + blubsetup.login_port  });
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
