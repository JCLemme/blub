var express = require('express');
var router = express.Router();
var blubsetup = require('../blub_setup.js')

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        res.render('guacamole', { title: 'Guac', guac_server: blubsetup.guac_host, uname_server: "ws://" + blubsetup.host + ':' + blubsetup.login_port });
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
