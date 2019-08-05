const nodes = require('./nodes.js')

function formatNodeView(node) {
	let now = Date.now()

	let lastAccess = Math.max(node.lastExchange.incomingAt, node.lastExchange.outgoingAt)
	let upTime = now - lastAccess + node.instance.now - node.instance.start
	upTime = formatTimespan(upTime)
	let incomingAt = node.lastExchange.incomingAt ? formatTimespan(now - node.lastExchange.incomingAt) : '(never)'
	let attemptedAt = node.lastExchange.attemptedAt ? formatTimespan(now - node.lastExchange.attemptedAt) : '(never)'
	let outgoingAt = node.lastExchange.outgoingAt ? formatTimespan(now - node.lastExchange.outgoingAt) : '(never)'

	return {
		id: node.instance.id,
		hash: node.instance.hash,
		geo: node.instance.geo,
		nodes: Object.keys(node.nodes).length,
		upTime,
		incomingAt,
		attemptedAt,
		outgoingAt,
		addr: node.lastExchange.addr,
		error: node.lastExchange.error
	}
}

const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const ONE_HOUR = ONE_MINUTE * 60
const ONE_DAY = ONE_HOUR * 24
const ONE_WEEK = ONE_DAY * 7

function formatTimespan(ms) {
	let n
	n = ms / ONE_WEEK | 0
	if (n > 0)
		return n + 'w'
	n = ms / ONE_DAY | 0
	if (n > 0)
		return n + 'd'
	n = ms / ONE_HOUR | 0
	if (n > 0)
		return n + 'h'
	n = ms / ONE_MINUTE | 0
	if (n > 0)
		return n + 'm'
	n = ms / ONE_SECOND | 0
	return n + 's'
}

function list() {
	let ret = []
	for (let id in nodes.live) {
		let info = formatNodeView(nodes.live[id])
		ret.push(info)
	}
	return ret
}

module.exports = list
