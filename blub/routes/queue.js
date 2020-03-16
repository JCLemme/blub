var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        res.render('queue', { title: 'Blub queue' });
    }
    else {
        res.redirect('/login');
    }
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
