module.exports = {
    userAgent: class {
        account   = '';
        callerid  = '';
        extensio  = '';
        username  = '';
        password  = '';
        uri       = '';
        useragent = "fermion_softphone";


        constructor(configuration) {
            const pjson = require('../package.json');

            if (configuration === undefined) {
                configuration = {};
            }

            if (configuration.account !== undefined && configuration.account.length != 0) {
                this.account = configuration.account;
            } else {
                this.account = '0001';
            }

            if (configuration.extension !== undefined && configuration.extension.length != 0) {
                this.extension = configuration.extension;
            } else {
                this.extension = this.account;
            }

            if (configuration.callerid !== undefined && configuration.callerid.length != 0) {
                this.callerid = configuration.callerid;
            } else {
                this.callerid = this.extension;
            }

            if (configuration.username !== undefined && configuration.username.length != 0) {
                this.username = configuration.username;
            } else {
                this.username = this.account;
            }

            if (configuration.password === undefined) {
                this.password = configuration.password;
            } else {
                this.password = '';
            }

            if (configuration.uri !== undefined && configuration.uri.length != 0) {
                this.uri = configuration.uri;
            } else {
                this.uri = 'sip.provider.net:5060';
            }

            if (configuration.useragent !== undefined) {
                this.useragent = configuration.useragent;
            } else {
                this.useragent = "Fermion SoftPhone v" + pjson.version;
            }
        }


        getAccount()   { return this.account;              }
        getCallerIdt() { return this.callerid;             }
        getExtension() { return this.extension;            }
        getUsername()  { return this.username;             }
        getPassword()  { return this.password.length == 0; }
        geURI()        { return this.uri;                  }
        getAgentName() { return this.useragent;            }
    },
}
