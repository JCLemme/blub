const fs = require('fs')

// This is just placeholder, we will obviously grab all of these from the backend of the rest of the site
username = '';
password = '';
address = '';

content = '\uFEFF' + 
`full address:s:<${address}>
username:s:<${username}>
password 51:b:<${password}>
`


fs.writeFile(`connectionFile ${username}.rdp`, content, {encoding: 'utf8'});