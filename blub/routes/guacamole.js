var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('guacamole', { title: 'Guac', guac_server: blubsetup.guac_host, uname_server: "ws://" + blubsetup.host + ':' + blubsetup.login_port });
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
