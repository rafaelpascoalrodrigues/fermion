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
    user_agent = new sip.userAgent(sip_configuration);

    $('#config_account').html(user_agent.getAccount());
    $('#config_callerid').html(user_agent.getCallerIdt());
    $('#config_extension').html(user_agent.getExtension());
    $('#config_username').html(user_agent.getUsername());
    $('#config_password').html(user_agent.getPassword());
    $('#config_uri').html(user_agent.geURI());
    $('#config_useragent').html(user_agent.getAgentName());

});