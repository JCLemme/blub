module.exports = {

    // The hostname that Blub runs as. Should match the URL that you access Blub from.
    host: '',
    
    // LDAP setup info. Blub needs an LDAP server to authenticate against, which means it also needs access to a user with read credentials for joining/connecting.
    ldap_server: '',
    ldap_user: '',
    ldap_pass: '',
    
    // Active Directory OUs for allowing login and administrator access. 
    ldap_base: '',
    ldap_admins: "",
    
    queue_default: './queue.json',
    machines_default: './machines.json',
    
    ws_port_client: 3001,
    cookie_secret: '',
    
    guac_host: '',
    guac_key: '',
    myrtille_server: "",

    max_queue_per_turn: 20,
    runner_delay: 15,
};


