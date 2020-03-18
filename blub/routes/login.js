var express = require('express');
var flash = require("connect-flash");
var router = express.Router();
var fs = require('fs');

var blubsetup = require('../blub_setup.js');

require('ssl-root-cas').addFile('./certs/ldap.pem');

var passport = require('passport');
var LdapStrategy = require('passport-ldapauth');

passport.use(new LdapStrategy({
    passReqToCallback : true,
    server: {
        url: blubsetup.ldap_server,
        bindDN: blubsetup.ldap_user,
        bindCredentials: blubsetup.ldap_pass,
        searchBase: blubsetup.ldap_base,
        searchFilter: '(&(objectcategory=person)(objectclass=user)(|(samaccountname={{username}})(mail={{username}})))',
        tlsOptions: {
            rejectUnauthorized: false,
            ca: [
                fs.readFileSync('certs/ldap.pem')
            ]
        }
    }
}));

passport.serializeUser(function(user, done) {
    //console.log(user)
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});
  
router.get('/', function(req, res, next) {
    if (!req.user) {
        res.render('login', { title: 'Blub login', failureFlash: req.flash('error'), login_server: "ws://" + blubsetup.host + ':' + blubsetup.login_port, uname_server: "ws://" + blubsetup.host + ':' + blubsetup.login_port, uname_server: "ws://" + blubsetup.host + ':' + blubsetup.login_port    });
    }
    else {
        res.redirect('/');
    }
    
});

router.post('/', passport.authenticate('ldapauth',{ successRedirect: '/', failureRedirect: '/login', failureFlash: true }), function(req, res) {
    res.json(req.user)
});

module.exports = router;
