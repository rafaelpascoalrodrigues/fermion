const sip = require('./sip.js');
const $ = require('jquery');


var sip_configuration  = {
    account:   '0001',
    callerid:  '0001',
    extension: '0001',
    username:  '0001',
    password:  'pass',
    uri:       'sip.provider.net:5060',
    useragent: 'NodeJS Electron WebRTC Softphone (develop)'
};

var user_agent = null;


$(function() {
    $('#state_connection').html('<font color="red"><b>disconnected</b></font>');

    user_agent = new sip.userAgent(sip_configuration);

    user_agent.on('connect', () => {
        $('#config_account').html(user_agent.getAccount());
        $('#config_callerid').html(user_agent.getCallerIdt());
        $('#config_extension').html(user_agent.getExtension());
        $('#config_username').html(user_agent.getUsername());
        $('#config_password').html(user_agent.getPassword());
        $('#config_uri').html(user_agent.geURI());
        $('#config_useragent').html(user_agent.getAgentName());
    
        $('#ua_transport').html(user_agent.getTransport());
        $('#ua_address').html(user_agent.getInterfaceAddress());
        $('#ua_port').html(user_agent.getInterfacePort());
        $('#ex_address').html(user_agent.getExternalAddress());
        $('#sip_address').html(user_agent.getProviderAddress());
        $('#sip_port').html(user_agent.getProviderPort());

        $('#state_connection').html('<font color="green"><b>connected</b></font>');
    });

    user_agent.connect();
});
