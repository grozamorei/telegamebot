const os = require('os');
const ifaces = os.networkInterfaces();

module.exports['do'] = () => {
    let result = ""
    Object.keys(ifaces).forEach((ifname) => {
        let alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return
            }

            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
                // console.log(ifname + ':' + alias, iface.address)
                result += ifname + ':' + alias + ' ' + iface.address + '\n'
            } else {
                // this interface has only one ipv4 adress
                // console.log(ifname, iface.address)
                result += ifname + ':' + alias + ' ' + iface.address
            }
            ++alias
        })
    })

    if (result.length === 0) return 'have no external ips'
    return result
}
