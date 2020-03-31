module.exports = {
    getIPv4: function() {
        'use strict';

        const os = require('os');
        const ifaces = os.networkInterfaces();
        var addresses = [];

        Object.keys(ifaces).forEach(function(ifname) {
            var alias = 0;

            ifaces[ifname].forEach(function(iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            addresses.push({"ifname": ifname, "alias": alias, "address": iface.address});
            alias++;
          });
        });
        return addresses;
    }
}
