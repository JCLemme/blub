var express = require('express');
var flash = require("connect-flash");
var router = express.Router();
var fs = require('fs');

var QueueWorker = require('@workers/queue_worker')
var MachineWorker = require('@workers/machine_worker')
var RemoteConnectionWorker = require('@workers/remote_worker')
var SessionWorker = require('@workers/session_worker')

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
        res.render('login', { title: 'Blub login', failureFlash: req.flash('error'), protocol: ((blubsetup.use_tls) ? 'wss://' : 'ws://'), server: blubsetup.host, endpoint: blubsetup.login_endpoint, mini_endpoint: blubsetup.login_endpoint });
    }
    else {
        res.redirect('/');
    }
    
});

// TODO: re-enable flash messages...
router.post('/', function(req, res, next) {
    passport.authenticate('ldapauth', {failureFlash: true}, function(err, user, info) {
        if (err) { return next(err); }
        
        if (!user) { return res.redirect('/login'); }
        
        req.login(user, function(err) {
            if (err) { return next(err); }
            console.log(req.body.username + ' ' + req.body.password);
            SessionWorker.pass(req.body.username, req.body.password);
            return res.redirect('/queue');
        });
    })(req, res, next);
});

module.exports = router;
