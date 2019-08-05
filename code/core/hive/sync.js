const log = require('newheelog')()
const throttle = require('./throttle.js')
const peer = require('../rpc/client/peer.js')
const instance = require('../instance.js')
const exchange = require('./exchange.js')
const nodes = require('./nodes.js')
const settings = require('./settings.js')
const config = require('../config.js')
const stat = require('../stat.js')

let dedupAddrs = {}
const availableCategories = [
	'*',
	'bootstrap',
	'live',
	'dormant'
]

function contactImpl(addr) {

	if (addr in dedupAddrs) {
		//log('dedupAddrs', addr)
		return false
	}
	dedupAddrs[addr] = false

	let p = peer(addr)
	let myInfo = exchange()
	let start = Date.now()
	return p.core.hive.exchange(myInfo)
		.then(peerInfo => {
			nodes.onPeer(peerInfo, addr, Date.now() - start)
			dedupAddrs[addr] = true

			return true
		})
}

const contact = throttle(contactImpl, settings.throttle)

async function sync(category, force) {

	if (!category || category === 'all') {
		category = '*'
	} else if (!availableCategories.includes(category)) {
		throw new Error('Invalid category: ' + category)
	}

	dedupAddrs = {}

	if (category === '*' || category === 'bootstrap')
		await syncBootstrap()

	if (category === '*' || category === 'live')
		await syncCategory(nodes.live, 'live', force)

	if (category === '*')
		await syncDiscoveryQueue()

	if (category === '*' || category === 'dormant')
		await syncCategory(nodes.dormant, 'dormant', force)

	if (category === '*')
		await syncDiscoveryQueue()

	nodes._save()

	stat.add('hive.sync').save()

	let contacted = 0
	for (let k in dedupAddrs)
		if (dedupAddrs[k])
			++contacted
	log(`Sync complete: live=${Object.keys(nodes.live).length}, dormant=${Object.keys(nodes.dormant).length}, contacted/totalAddrs=${contacted}/${Object.keys(dedupAddrs).length}`)
}

async function syncBootstrap() {
	log('sync bootstrap:', config.bootstrap.length)
	let tasks = config.bootstrap.map(a => contact(a).catch(onFailure(a)))
	await Promise.all(tasks)
	function onFailure(addr) {
		return e => log('=x bootstrap', addr, e.toString())
	}
}

async function syncDiscoveryQueue() {

	while (true) {
		let n = await impl()
		if (n === 0)
			return
	}

	async function impl() {
		let targets = new Set
		let addrs
		while (addrs = nodes.pollDiscovery())
			addrs.forEach(item => targets.add(item))

		if (targets.size !== 0) {
			log(`sync discovery: uniqueAddrs=${targets.size}`)
			let tasks = []
			targets.forEach(a => {
				let p = contact(a).catch(onFailure(a))
				tasks.push(p)
			})
			await Promise.all(tasks)

			function onFailure(addr) {
				return e => log('=x discover', addr, e.toString())
			}
		}
		return targets.size
	}
}

function syncCategory(category, name, force) {
	log(`sync ${name}:`, Object.keys(category).length)
	let copyOfKeys = Object.keys(category)
	let tasks = []
	for (let k of copyOfKeys) {
		if (k === instance.id)
			continue
		let node = category[k]

		tasks.push(syncNode(node, force))
	}
	return Promise.all(tasks)
}

async function syncNode(node, force) {
	if (isRecentNode(node) && !force) {
		log('skip recent', node.instance.id, node.instance.geo)
		return
	}

	node.lastExchange.attemptedAt = Date.now()
	let lastAddr = node.lastExchange.addr
	if (lastAddr) {
		try {
			let success = await contact(lastAddr)
			if (success)
				return
		} catch (e) {
			onFailure(lastAddr, node)
		}
	}

	let addrsCopy = node.addrs.slice()

	return new Promise((resolve) => {
		let finished = 0
		for (let addr of addrsCopy) {
			if (addr === lastAddr) {
				onFinishOne()
				continue
			}

			contact(addr)
				.then(success => success ? resolve() : 0)
				.catch(onFailure(addr, node))
				.then(onFinishOne)
		}
		function onFinishOne() {
			if (++finished >= addrsCopy.length) {
				nodes.onPeerFailure(node, addrsCopy, 'Contact failed on all addrs')
				resolve()
			}
		}
	})

	function onFailure(addr, theNode) {
		return e => log(`=x sync ${addr} (${theNode.instance.id}, ${theNode.instance.geo}): ${e.toString()}`)
	}
}

function isRecentNode(node) {
	let lastSeenAt = Math.max(node.lastExchange.incomingAt, node.lastExchange.outgoingAt, node.lastExchange.attemptedAt)

	//after restart, sync all
	if (lastSeenAt < instance.start)
		return false

	return Date.now() - lastSeenAt < settings.MIN_CONTACT_INTERVAL
}

module.exports = sync