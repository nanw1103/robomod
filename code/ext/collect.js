const nodes = require('../core/hive/nodes.js')
const peer = require('../core/rpc/client/peer.js')
const instance = require('../core/instance.js')
const QuickLru = require('quick-lru')
const stat = require('../core/stat.js')

const cache = new QuickLru({ maxSize: 1000 })

const topicHandlers = {
	geo: getGeo
}

function node(id, timeout) {
	let n = nodes.live[id]
	if (!n)
		return

	let addr
	if (n.lastExchange)
		addr = n.lastExchange.addr
	if (!addr) {
		addr = n.addrs[0]
	}
	if (!addr)
		return
	return peer(addr, {
		timeout
	})
}

async function collect(options) {

	stat.add('ext.collect')

	if (typeof options === 'string') {
		options = {
			topic: options,
			ttl: 10000,
			id: Math.random()
		}
	} else {
		options.ttl -= 1000
	}

	//console.log(options)

	let cached = cache.get(options.id)
	if (cached)
		return {}
	cache.set(options.id, true)

	let spread = options.ttl > 0

	let tasks = []
	tasks.push(collectSelf())
	if (spread) {
		for (let id in nodes.live)
			tasks.push(collectNode(id))
	}

	let items = await Promise.all(tasks)

	let ret = {}
	for (let i of items)
		Object.assign(ret, i)
	//console.log('collected', items, ret)
	return ret

	async function collectSelf() {
		let fn = topicHandlers[options.topic]
		try {
			return {[instance.id]: await fn()}
		} catch (e) {
			console.log(e)
		}
	}

	async function collectNode(id) {
		try {
			return await node(id, options.ttl).ext.collect(options)
		} catch (e) {
			console.log('Fail collecting node', id, e)
		}
	}
}

async function getGeo() {
	return instance.config.geo
}

module.exports = collect