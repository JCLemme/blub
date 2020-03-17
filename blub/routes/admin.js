var express = require('express');
var createError = require('http-errors');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        if(req.user['memberOf'] != undefined) {
            if (req.user['memberOf'].includes("CN=ECC_Administrators,OU=ECC Administrators,OU=ECC,OU=Engineering Users,DC=ecc,DC=egr,DC=uri,DC=edu")) {
                res.render('admin', { title: 'Blub admin' });
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
