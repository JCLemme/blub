module.exports = {

    // The hostname that Blub runs as. Should match the URL that you access Blub from.
    host: 'blub.example.com',
    
    // LDAP setup info. Blub needs an LDAP server to authenticate against, which means it also needs the credentials of a user with read permissions for joining/connecting.
    // As a result, you should keep this setup file secure. You should also make sure the service account you use only has LDAPpy permissions - 
    // if the account you use is your domain administrator's then you deserve what might happen
    ldap_server: 'ldaps://ldap.example.com',
    ldap_user: 'AuthenticationUser',
    ldap_pass: '5uper!S3crEt',
    
    // Should Blub cache passwords for automatic remote session login?
    // (see blub/workers/session_worker.js for a longer explanation of this option)
    session_password: true,
    
    // Active Directory OUs.
    // Base is for any account that can log into Blub.
    ldap_base: 'dc=example,dc=com',
    // Moderators are people who can moderate classes and reserve machines. Usually used for professors or TAs.
    ldap_mods: 'ou=teachers,dc=example,dc=com',
    // Admins are Blub administrators, with access to all of Blub's management tools.
    ldap_admins: 'ou=operators,dc=example,dc=com',

    // A secret for encrypting cookies. Change this to a nice long random string.
    cookie_secret: 'changeme!!!',
    
    // Ports and endpoints for the Blub websockets.
    // You probably shouldn't be changing these, but if the Blub server already has something using ports 3000-3004 then you might need 
    // to shift things around. The endpoints are what client machines will see.
    queue_port: 3001,
    queue_endpoint: '/ws_queue',
    
    login_port: 3002,
    login_endpoint: '/ws_login',
    
    client_port: 3003,
    client_endpoint: '/ws_client',
    
    admin_port: 3004,
    admin_endpoint: '/ws_admin',
    
    // Guacamole credentials. 
    guac_host: 'guacamole.example.com',
    guac_key: 'changeme!!!',
    
    // Myrtille server, if you choose to use it.
    myrtille_server: 'myrtille.example.com',
    

};


