var {https} = require('follow-redirects')

var myrtille_hash = async function(password, callback) {
    var hash = "";
    
    var request = await https.get("https://lime.egr.uri.edu/myrtille/GetHash.aspx?password=" + encodeURIComponent(password), {rejectUnauthorized: false}, res => {
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
    return "https://lime.egr.uri.edu/Myrtille/?__EVENTTARGET=&__EVENTARGUMENT=&connect=Connect%21&server=" + machine['ip'] + "&domain=ECC&user=" + machine['user'] + "&passwordHash=" + hash;
};

module.exports.myrtille_hash = myrtille_hash;
module.exports.myrtille_link = myrtille_link;
