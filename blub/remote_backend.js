var {https} = require('follow-redirects')
var blubsetup = require('./blub_setup.js')

var myrtille_hash = async function(password, callback) {
    var hash = "";
    
    var request = await https.get(blubsetup.myrtille_server + "/myrtille/GetHash.aspx?password=" + encodeURIComponent(password), {rejectUnauthorized: false}, res => {
        res.setEncoding("utf8");
        
        let phash = "";
        
        res.on("data", data => {
            phash += data;
        });
        
        res.on("end", () => {
            console.log("Generated hash " + phash);
            callback(phash);
        });
    });
};

var myrtille_link = function(machine, hash) {
    return blubsetup.myrtille_server + "/Myrtille/?__EVENTTARGET=&__EVENTARGUMENT=&connect=Connect%21&server=" + machine['ip'] + "&domain=ECC&user=" + machine['user'] + "&passwordHash=" + hash;
};

module.exports.myrtille_hash = myrtille_hash;
module.exports.myrtille_link = myrtille_link;
