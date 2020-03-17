var express = require('express');
var flash = require("connect-flash");
var router = express.Router();
var fs = require('fs');

var secrets = require('./blub_secrets.js');

require('ssl-root-cas').addFile('./certs/ldap.pem');

var passport = require('passport');
var LdapStrategy = require('passport-ldapauth');

passport.use(new LdapStrategy({
    passReqToCallback : true,
    server: {
        url: 'ldaps://dc1.ecc.egr.uri.edu',
        bindDN: secrets.user,
        bindCredentials: secrets.pass,
        searchBase: 'dc=ecc,dc=egr,dc=uri,dc=edu',
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
        res.render('login', { title: 'Blub login', failureFlash: req.flash('error') });
    }
    else {
        res.redirect('/');
    }
    
});

router.post('/', passport.authenticate('ldapauth',{ successRedirect: '/', failureRedirect: '/login', failureFlash: true }), function(req, res) {
    res.json(req.user)
});

module.exports = router;