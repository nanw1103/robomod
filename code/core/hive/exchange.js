const os = require('os')
const instance = require('../instance.js')
const nodes = require('./nodes.js')

function myInfo() {
	let ret = {
		instance: {
			...instance
		},
		addrs: myAddrs(),
		nodes: liveNodes()
	}
	delete ret.instance.config
	ret.instance.geo = instance.config.geo
	return ret
}

function liveNodes() {
	let ret = {}
	for (let id in nodes.live)
		ret[id] = nodes.live[id].addrs
	return ret
}

function myAddrs() {
	let ips = getIPs()
	return ips.map(ip => ip + ':' + instance.config.http.port)
}

function getIPs() {
	let ips = []
	let ifaces = os.networkInterfaces()
	Object.keys(ifaces).forEach(ifname => {
		ifaces[ifname].forEach(iface => {
			if (iface.family !== 'IPv4' || iface.internal)
				return	// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
			ips.push(iface.address)
		})
	})
	return ips
}

function exchange(peerInfo) {
	if (peerInfo && peerInfo.instance && peerInfo.instance.id)
		nodes.onPeer(peerInfo)
	return myInfo()
}

module.exports = exchange