const fs = require('fs')

// This is just placeholder, we will obviously grab all of these from the backend of the rest of the site


username = `ecc\\`
password = '';
address = '';

content = '\uFEFF' + 
`full address:s:<'${address}'>
username:s:<'${username}'>
password:s:<'${password}'>
`


fs.writeFile(`connectionFile - ${username}.rdp`, content, function (err) {
    if (err) throw err
    console.log('done')
});