module.exports = {
    userAgent: class {
        INTERFACE_PORT_MIN = 55000;
        INTERFACE_PORT_MAX = 59999;

        account   = '';
        callerid  = '';
        extensio  = '';
        username  = '';
        password  = '';
        uri       = '';
        useragent = "fermion_softphone";

        transport         = 'UDP';  /* only udp available at this moment */
        interface_address = '';
        interface_port    = '';
        provider_address  = '';
        provider_port     = '';
    
        emitter = null;

        socket = null;

        pickInterfacePort() {
            return Math.floor(Math.random() * (this.INTERFACE_PORT_MAX - this.INTERFACE_PORT_MIN)) + this.INTERFACE_PORT_MIN;
        }


        constructor(configuration) {
            const pjson = require('../package.json');
            const events = require('events');
            const network = require('./network.js');

            this.emitter = new events.EventEmitter();

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


            var ipv4_interfaces = network.getIPv4();
            if (ipv4_interfaces[0] !== undefined) {
                this.interface_address = ipv4_interfaces[0]['address'];
            }

            this.interface_port = this.pickInterfacePort();

            var re = new RegExp(/([A-Za-z0-9\.]*)(?::([0-9]*))?/)
            var mt = this.uri.match(re);
            this.provider_address = mt[1];
            if (mt[2] !== undefined) {
                this.provider_port = mt[2];
            } else {
                this.provider_port = 5060;
            }
        }

        connect() {
            const dgram = require('dgram');

            this.socket = dgram.createSocket('udp4');

            this. socket.on('error', (err) => {
                this.socket.close();
            });

            this.socket.on('message', (msg, rinfo) => {
                console.log(`%c${msg}`, 'color: #800000');
            });

            this.socket.on('listening', () => {
                const address = this.socket.address();
                console.log(`%csocket listening ${address.address}:${address.port}`, 'color: green');
                
                this.emitter.emit('connect');
            });

            this.socket.bind(this.interface_port, this.interface_address);
        }

        on(event, listener) { this.emitter.on(event, listener); }

        getAccount()   { return this.account;              }
        getCallerIdt() { return this.callerid;             }
        getExtension() { return this.extension;            }
        getUsername()  { return this.username;             }
        getPassword()  { return this.password.length == 0; }
        geURI()        { return this.uri;                  }
        getAgentName() { return this.useragent;            }

        getTransport()        { return this.transport;         }
        getInterfaceAddress() { return this.interface_address; }
        getInterfacePort()    { return this.interface_port;    }
        getProviderAddress()  { return this.provider_address;  }
        getProviderPort()     { return this.provider_port;     }
    },
}
