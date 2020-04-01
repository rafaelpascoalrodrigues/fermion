module.exports = {
    userAgent: class {
        INTERFACE_PORT_MIN = 55000;
        INTERFACE_PORT_MAX = 59999;

        SOCKET_KEEPALIVE_TIMEOUT = 30000;

        sip_allow = "REGISTER"

        account   = '';
        callerid  = '';
        extension = '';
        username  = '';
        password  = '';
        uri       = '';
        useragent = "fermion_softphone";

        transport         = 'UDP';  /* only udp available at this moment */
        interface_address = '';
        interface_port    = '';
        external_address  = '';
        provider_address  = '';
        provider_port     = '';
    
        emitter = null;

        socket = null;
        socket_keepalive = undefined;

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

            var server = this.socket;
            var external_address = '';

            this. socket.on('error', (err) => {
                console.log(`%csocket error ${err}`, 'color: #008000');
                //this.socket.close();
            });

            this.socket.on('message', (msg, rinfo) => {
                console.log(`%c${msg}`, 'color: #800000');
            });

            this.socket.on('listening', () => {
                const address = this.socket.address();
                console.log(`%csocket listening ${address.address}:${address.port}`, 'color: green');

                if (this.socket_keepalive !== undefined) {
                    clearInterval(this.socket_keepalive);
                }
                this.socket_keepalive = setInterval(() => {
                    const message = Buffer.from(String.fromCharCode(13, 10, 13, 10));
                    this.socket.send(message, 50600, 'sipuranet.paneas.net', (err) => {
                        console.log(`%ckeepalive (0d 0a 0d 0a) sent`, 'color: #008000');
                    });
                }, this.SOCKET_KEEPALIVE_TIMEOUT);

                if (external_address !== undefined) {
                    this.external_address = external_address
                }

                this.emitter.emit('connect');
            });


            const http = require('http');
            http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, (resp) => {
                resp.on('data', (ip)  => {
                    external_address = '' + ip;

                    server.bind(this.interface_port, this.interface_address);
                });
            })
            .on('error', (err) => {

                server.bind(this.interface_port, this.interface_address);
            });
        }


        Register() {
            var header = `` +
                `REGISTER sip:${this.provider_address}:${this.provider_port} SIP/2.0` + "\r\n" +
                `Via: SIP/2.0/UDP ${this.interface_address}:${this.interface_port};branch=z9hG4bK-12345678901234567890123456789012345;rport` + "\r\n" +
                `Max-Forwards: 70` + "\r\n" +
                `Contact: <sip:${this.extension}@${this.external_address}:${this.interface_port};transport=${this.transport};rinstance=1234567890123456>` + "\r\n" +
                `To: \"${this.callerid}\"<sip:${this.extension}@${this.provider_address}:${this.provider_port}>` + "\r\n" +
                `From: \"${this.callerid}\"<sip:${this.extension}@${this.provider_address}:${this.provider_port}>;tag=12345678` + "\r\n" +
                `Call-ID: 12345678901234567890123456789012345678901234567890` + "\r\n" +
                `CSeq: 1 REGISTER` + "\r\n" +
                `Expires: 120` + "\r\n" +
                `Allow: ${this.sip_allow}` + "\r\n" +
                `Supported: replaces` + "\r\n" +
                `User-Agent: ${this.useragent}` + "\r\n" +
                `Content-Length: 0` + "\r\n" 
                "\r\n\r\n"


            const message = Buffer.from(header);
            this.socket.send(message, this.provider_port, this.provider_address, (err) => {
                console.log(`%c${message}`, 'color: #000080');
            });
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
        getExternalAddress()  { return this.external_address;  }
        getProviderAddress()  { return this.provider_address;  }
        getProviderPort()     { return this.provider_port;     }
    },
}
