var express = require('express');
var createError = require('http-errors');
var router = express.Router();

var blubsetup = require('../blub_setup.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        if(req.user['memberOf'] != undefined) {
            if (req.user['memberOf'].includes(blubsetup.ldap_admins)) {
                res.render('admin', { title: 'Blub admin', admin_server: "ws://" + blubsetup.host + ':' + blubsetup.client_port_external });
            }
            else {
                next(createError(403));
            }
        }
        else {
            next(createError(401));
        }
    }
    else {
        next(createError(401));
        //res.redirect('/login');
    }
});

module.exports = router;
