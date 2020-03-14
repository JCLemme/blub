var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.user) {
        if(req.user['memberOf'] != undefined) {
            if (req.user['memberOf'].includes("CN=ECC_Administrators,OU=ECC Administrators,OU=ECC,OU=Engineering Users,DC=ecc,DC=egr,DC=uri,DC=edu")) {
                res.render('admin', { title: 'Blub admin' });
            }
        }
        else {
            res.status(401).send("You ain't allowed back here, go away")
        }
    }
    else {
        res.redirect('/login');
    }
});

module.exports = router;
