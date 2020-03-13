var express = require('express');
var router = express.Router();
var fs = require('fs');

var secrets = require('./blub_secrets.js');

require('ssl-root-cas').addFile('./certs/ldap.pem');
var flash = require("connect-flash");

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
  res.render('login', { title: 'Blub login' });
});

router.post('/', passport.authenticate('ldapauth',{ successRedirect: '/queue', failureRedirect: '/login', failureFlash: false }), function(req, res) {
    res.json(req.user)
});

module.exports = router;
