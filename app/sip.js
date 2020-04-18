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
                this.ParseReceivedSIP2('' + msg);
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
                    this.socket.send(message, this.provider_port,this.provider_address, (err) => {
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

        randomSequence(length) {
            var seq = '';
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var chars_len = chars.length;
            for (var i = 0; i < length; i++) {
                seq += chars.charAt(Math.floor(Math.random() * chars_len));
            }
            return seq;
        }

        Register() {

            var call_id = this.randomSequence(64);
            var branch = 'z9hG4bK' + this.randomSequence(57);
            var tag = this.randomSequence(16);


            var header = `` +
                `REGISTER sip:${this.provider_address}:${this.provider_port} SIP/2.0` + "\r\n" +
                `Via: SIP/2.0/UDP ${this.interface_address}:${this.interface_port};branch=${branch};rport` + "\r\n" +
                `Max-Forwards: 70` + "\r\n" +
                `Contact: <sip:${this.extension}@${this.external_address}:${this.interface_port};transport=${this.transport};rinstance=1234567890123456>` + "\r\n" +
                `To: \"${this.callerid}\"<sip:${this.extension}@${this.provider_address}:${this.provider_port}>` + "\r\n" +
                `From: \"${this.callerid}\"<sip:${this.extension}@${this.provider_address}:${this.provider_port}>;tag=${tag}` + "\r\n" +
                `Call-ID: ${call_id}` + "\r\n" +
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


        ParseReceivedSIP2(message) {
            var message_array = message.split('\r\n');
            var message_len = message_array.length;
            var message_list = { "HEADER": { "plaintext": message_array[0] , 'data_array': [] } };

            var re_headers = new RegExp(/(\S*)\s*:\s*(.*)/);
            var re_header_space = new RegExp(/[^\s]+/g);
            var re_header_comma = new RegExp(/[^,\s]+/g);
            var re_header_equal = new RegExp(/(\w*)=((?:"([^"]*)")|(?:[^\s,]*))/g);
            var re_header_semicolon = new RegExp(/;?([^;]+)/g);
            var re_header_equal_semicolon = new RegExp(/;(\w+)(?:=((?:"([^"]*)")|(?:[^\s;,]*)))?/g);

            var re_first_nonspace = new RegExp(/^s*(\S*)\s*(.*)/);
            var re_address_port = new RegExp(/\s*([A-Za-z0-9\.]*)(?::([0-9]*))?\s*/);

            var re_identification_name = new RegExp(/\s*(?:(?:"([^"\\]*(?:\\.[^"\\]*)*)")|(\S*))\s*(<sip:.*)/);
            var re_identification_uri = new RegExp(/(?:(<(sip:[^>]*)>)|(sip:[^;\s]*))(.*)/);


            var data = re_first_nonspace.exec(message_array[0]);
            var data_string = data[1];
            var temp_string = data[2];
            re_first_nonspace.exec(/* clear regex */);

            if (data_string == 'SIP/2.0') {
                message_list["HEADER"]['version'] = data_string;
                data = re_first_nonspace.exec(temp_string);
                
                message_list["HEADER"]['status_code'] = parseInt(data[1]);
                message_list["HEADER"]['reason_phrase'] = data[2];
                re_first_nonspace.exec(/* clear regex */);
            } else {
                message_list["HEADER"]['method'] = data_string;
            }


            for(var i = 1; i < message_len; i++) {
                if (message_array[i] == "") {
                    break
                }
                
                var mt = message_array[i].match(re_headers);             
                if (mt !== null) {
                    var header = mt[1];
                    var plaintext = mt[2];

                    message_list[header] = {
                        'plaintext': plaintext,
                        'data_array': []
                    };

                    var data_array = []; 
                    if (header == 'Allow') {
                        data_array = plaintext.match(re_header_comma);

                    } else if (header == 'Supported') {
                        data_array = plaintext.match(re_header_comma);

                    } else if (header == 'CSeq') {
                        data_array = plaintext.match(re_header_space);
                        if (data_array !== null) {
                            message_list[header]['sequence'] = parseInt(data_array[0]);
                            message_list[header]['method'] = data_array[1];
                        }

                    } else if (header == 'From' || header == 'To') {                        
                        var temp_string = "";
                        var temp_array = re_identification_name.exec(plaintext);
                        
                        var identification_name = temp_array[1] != null ? temp_array[1] : temp_array[2];
                        temp_string  = temp_array[3];
                        re_identification_name.exec(/* clear regex */);
                        
                        temp_array = re_identification_uri.exec(temp_string);
                        
                        var identification_uri =  temp_array[2] != null ? temp_array[2] : temp_array[3];
                        temp_string  = temp_array[4];
                        temp_array = re_identification_uri.exec(/* clear regex */);
                        

                        message_list[header]['identification_name'] = identification_name;
                        message_list[header]['identification_uri'] = identification_uri;

                        data_array = [ identification_name, identification_uri];

                        temp_array = temp_string.match(re_header_semicolon);
                        for (j = 0; j < temp_array.length; j++) {
                            var parameter = re_header_equal_semicolon.exec(temp_array[j]);
                            
                            if (parameter != null) {
                                data_array.push(parameter[0].replace(/^;/, ''));
                                var parameter_name = parameter[1];
                                var parameter_value = parameter[3] != null ? parameter[3] : parameter[2] != undefined ? parameter[2] : '';
                                message_list[header][parameter_name] = parameter_value;
                            }
                            re_header_equal_semicolon.exec(/* clear regex */);
                        }

                    } else if (header == 'WWW-Authenticate') {
                        var scheme = plaintext.match(re_header_space);
                        message_list[header]['scheme'] = scheme[0];

                        data_array = plaintext.match(re_header_equal);
                        for (var j = 0; j < data_array.length; j++) {
                            var parameter = re_header_equal.exec(data_array[j]);
                            
                            if (parameter != null) {
                                var parameter_name = parameter[1];
                                var parameter_value = parameter[3] != null ? parameter[3] : parameter[2];
                                message_list[header][parameter_name] = parameter_value;
                            }
                            re_header_equal.exec(/* clear regex */);
                        }
                        data_array.unshift(scheme[0]);

                    } else if (header == 'Via') {
                        var data = re_first_nonspace.exec(plaintext);
                        
                        message_list[header]['version'] = data[1];
                        var temp_array = data[2].match(re_header_semicolon);
                        re_first_nonspace.exec(/* clear regex */);

                        var address = re_address_port.exec(temp_array[0]);
                        data_array = [];
                        data_array.push(data[1]);
                        data_array.push(address[0]);
                        re_address_port.exec(/* clear regex */);

                        if (address != null) {
                            message_list[header]['address'] = address[1];
                            message_list[header]['port'] = parseInt(address[2]);
                        }

                        for (j = 1; j < temp_array.length; j++) {
                            var parameter = re_header_equal_semicolon.exec(temp_array[j]);
                            if (parameter != null) {
                                data_array.push(parameter[0].replace(/^;/, ''));
                                var parameter_name = parameter[1];
                                var parameter_value = parameter[3] != null ? parameter[3] : parameter[2] != undefined ? parameter[2] : '';
                                message_list[header][parameter_name] = parameter_value;
                            }
                            re_header_equal_semicolon.exec(/* clear regex */);
                        }

                    } else {
                        data_array = plaintext.match(re_header_space);
                    }

                    message_list[header]['data_array'] = data_array;
                }
            }
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
