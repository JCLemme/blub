var winrm = require('nodejs-winrm');
const fs = require('fs');
var blubsetup = require('./blub_setup.js')

send_message = function(computer, username, message) {
    winrm.runCommand('msg ' + username + ' "' + message + '"', computer, blubsetup.winrm_user, blubsetup.winrm_pass, blubsetup.winrm_port);
};

module.exports.send_message = send_message;
