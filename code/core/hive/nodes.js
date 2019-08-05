const log = require('newheelog')()
const sync = require('../update/client/sync.js')
const modFile = require('../data/mod-file.js')
const instance = require('../instance.js')
const settings = require('./settings.js')

const liveNodesFile = modFile('live-nodes')
const liveNodes = liveNodesFile.load({})
const dormantNodesFile = modFile('dormant-nodes')
const dormantNodes = dormantNodesFile.load({})

const discoveryNodes = {}

function _save() {
	liveNodesFile.save()
	dormantNodesFile.save()
}

function discover(id, addrs) {
	if (id in liveNodes || id in dormantNodes || id === instance.id) {
		//log('discover skip known', id)
		return
	}
	//log('discover', id, addrs)
	discoveryNodes[id] = addrs
}

function pollDiscovery() {
	for (let k in discoveryNodes) {
		let addrs = discoveryNodes[k]
		delete discoveryNodes[k]
		return addrs
	}
}

function onPeer(peerInfo, addrUsed, roundTripTime) {
	let id = peerInfo.instance.id
	if (!id || id === process.env.robomod_id)
		return

	log('=>', id, peerInfo.instance.geo, addrUsed || '<incoming>')

	//update genesis
	if (peerInfo.instance.genesis < instance.genesis) {
		instance.genesis = peerInfo.instance.genesis
		log('Genesis updated:', new Date(instance.genesis))
	}

	let node = liveNodes[id] || dormantNodes[id]
	if (!node) {
		node = {
			...peerInfo,
			lastExchange: {
				incomingAt: 0,
				attemptedAt: 0,
				outgoingAt: 0,
				addr: undefined,
				error: undefined,
			},
			continuousFailure: 0,
		}
	} else {
		node = {
			...node,
			...peerInfo
		}
	}

	if (roundTripTime)
		node.lastExchange.roundTripTime = roundTripTime

	let isIncoming = addrUsed === undefined
	let now = Date.now()
	if (isIncoming) {
		node.lastExchange.incomingAt = now
	} else {
		node.lastExchange.attemptedAt = now
		node.lastExchange.outgoingAt = now
		node.lastExchange.addr = addrUsed
		node.lastExchange.error = undefined
		node.continuousFailure = 0
	}

	delete liveNodes[id]
	delete dormantNodes[id]
	liveNodes[id] = node

	ensureCapacity(liveNodes, 'liveNodes')

	//identify new nodes
	for (let i in peerInfo.nodes) {
		if (liveNodes[i] || dormantNodes[i])
			continue
		discover(i, peerInfo.nodes[i])
	}

	//identify new modules
	if (isIncoming) {
		//nothing. initiator is responsible to pull/push delta
	} else {
		sync(peerInfo.instance.version, addrUsed)
	}
}

function onPeerFailure(node, addrUsed, err) {
	let id = node.instance.id

	log('=X', id, node.instance.geo, addrUsed)

	delete liveNodes[id]
	delete dormantNodes[id]

	let now = Date.now()

	if (++node.continuousFailure > settings.CONTINUOUS_FAILURE_BEFORE_REMOVAL) {
		let isDead = now - node.lastExchange.incomingAt > 2 * settings.CRAWL_INTERVAL + 60 * 1000
		if (isDead) {
			log('forfeit', id)
			return
		}
	}

	node.lastExchange.attemptedAt = Date.now()
	node.lastExchange.error = err.toString()

	if (isLive(node)) {
		liveNodes[id] = node
	} else {
		dormantNodes[id] = node
		ensureCapacity(dormantNodes, 'dormantNodes')
	}
}

function isLive(node) {
	let lastSeenAt = Math.max(node.lastExchange.incomingAt, node.lastExchange.outgoingAt)
	let inactive = Date.now() - lastSeenAt
	return inactive < settings.CRAWL_INTERVAL
}

function ensureCapacity(category, name) {
	let keys = Object.keys(category)
	if (keys.length > settings.NODE_CAPACITY) {
		let discarded = []
		for (let i = 0; i < keys.length/10; i++) {
			let k = keys[i]
			delete category[k]
			discarded.push(k)
		}
		log(`Discarding ${name}: ${discarded}`)
	}
}

module.exports = {
	live: liveNodes,
	dormant: dormantNodes,
	unknown: discoveryNodes,
	pollDiscovery,
	discover,
	onPeer,
	onPeerFailure,
	_save
}