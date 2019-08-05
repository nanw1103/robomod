#!/bin/env node
require('./util/init.js')
const local = require('./util/local.js')
const { delay } = require('otherlib')
const formatTable = require('./util/format-table.js')
const compareModuleVersions = require('../core/update/client/util.js').compareModuleVersions

async function main() {
	let nodes = await local.core.hive.nodes()

	let listDormant = process.argv[3] === 'dormant'	//FIXME

	//console.log(nodes)

	let now = Date.now()
	let myInst = await local.core.instance()

	let distance1Nodes = new Set
	let rows = []
	for (let k in nodes.live) {
		let n = nodes.live[k]
		rows.push(formatNodeView(n, true))
		for (let id in n.nodes) {
			if (!(id in nodes))
				distance1Nodes.add(id)
		}
	}

	if (listDormant) {
		for (let k in nodes.dormant) {
			let n = nodes.dormant[k]
			rows.push(formatNodeView(n, false))
			for (let id in n.nodes) {
				if (!(id in nodes))
					distance1Nodes.add(id)
			}
		}
	}

	//for (let id of distance1Nodes)
	//	rows.push({id})
	await local.core.stat()	//trigger BPS calc
	await delay(2100)
	let stat = await local.core.stat()
	let nodeUpTime = now - myInst.start
	let systemUptime = formatTimespan(now - myInst.genesis)

	let bpsIn = formatTraffic(stat.bps.in)
	let bpsOut = formatTraffic(stat.bps.out)
	let avgBpsIn = formatTraffic(stat.transient.bytesRead/(nodeUpTime/1000)|0)
	let avgBpsOut = formatTraffic(stat.transient.bytesWritten/(nodeUpTime/1000)|0)
	let trafficIn = formatTraffic(stat.transient.bytesRead)
	let trafficOut = formatTraffic(stat.transient.bytesWritten)

	let headers = [
		{key: 'geo', sort: 1},
		'version',
		'nodes',
		'age',
		'upTime',
		'incomingAt',
		'attemptedAt',
		'outgoingAt',
		'RTT',
		'addr',
		'id'
	]
	if (listDormant)
		headers.splice(4, 0, 'dormant')

	let text = formatTable(rows, headers)
	text += `Nodes (d0/d1): ${rows.length}/${distance1Nodes.size + rows.length}    `
		+ `Network uptime: ${systemUptime}    Node uptime: ${formatTimespan(nodeUpTime)}\n`
		+ `BPS: ${bpsIn}/${bpsOut}    AVG BPS:${avgBpsIn}/${avgBpsOut}    `
		+ `Traffic: ${trafficIn}/${trafficOut}`
	console.log(text)

	function formatNodeView(node, live) {
		let lastExchange = node.lastExchange || {}
		let lastAccess = Math.max(lastExchange.incomingAt, lastExchange.outgoingAt)
		let age = formatTimespan(now - node.instance.birthday)
		let upTime = formatTimespan(now - lastAccess + node.instance.now - node.instance.start)
		let dormant = live ? 'live' : 'dormant'
		let incomingAt = lastExchange.incomingAt ? formatTimespan(now - lastExchange.incomingAt) : '(never)'
		let attemptedAt = lastExchange.attemptedAt ? formatTimespan(now - lastExchange.attemptedAt) : '(never)'
		let outgoingAt = lastExchange.outgoingAt ? formatTimespan(now - lastExchange.outgoingAt) : '(never)'
		let RTT = lastExchange.roundTripTime
		let addr = lastExchange.addr
		let defaultPortPart = ':' + myInst.config.http.port
		if (addr && addr.endsWith(defaultPortPart))
			addr = addr.substring(0, addr.length - defaultPortPart.length)

		return {
			id: node.instance.id,
			version: formatVersionDiff(node.instance.version),
			geo: node.instance.geo,
			nodes: Object.keys(node.nodes).length,
			age,
			upTime,
			dormant,
			incomingAt,
			attemptedAt,
			outgoingAt,
			RTT,
			addr,
			error: lastExchange.error
		}
	}

	function formatVersionDiff(target) {
		let myNew = !!compareModuleVersions(target, myInst.version)
		let targetNew = !!compareModuleVersions(myInst.version, target)

		if (myNew && targetNew)
			return 'MIXED'
		if (myNew)
			return 'STALE'
		if (targetNew)
			return 'NEW'
		return 'SAME'
	}
}

const KiB = 1024
const MiB = 1024 * KiB
const GiB = 1024 * MiB
const TiB = 1024 * GiB

function formatTraffic(bytes) {

	if (bytes > TiB)
		return (bytes / TiB * 10 | 0 ) / 10 + 'TiB'
	if (bytes > GiB)
		return (bytes / GiB * 10 | 0 ) / 10 + 'GiB'
	if (bytes > MiB)
		return (bytes / MiB * 10 | 0 ) / 10 + 'MiB'
	if (bytes > KiB)
		return (bytes / KiB * 10 | 0 ) / 10 + 'KiB'
	return bytes + 'B'
}

const ONE_SECOND = 1000
const ONE_MINUTE = ONE_SECOND * 60
const ONE_HOUR = ONE_MINUTE * 60
const ONE_DAY = ONE_HOUR * 24
const ONE_WEEK = ONE_DAY * 7
const ONE_YEAR = ONE_DAY * 365

function formatTimespan(ms) {
	let years = ms / ONE_YEAR | 0
	ms -= years * ONE_YEAR
	let weeks = ms / ONE_WEEK | 0
	ms -= weeks * ONE_WEEK
	if (years > 0)
		return `${years}y${weeks}w`
	let days = ms / ONE_DAY | 0
	ms -= days * ONE_DAY
	if (weeks > 0)
		return `${weeks}w${days}d`
	let hours = ms / ONE_HOUR | 0
	ms -= hours * ONE_HOUR
	if (days > 0)
		return `${days}d${twoDigits(hours)}h`
	let minutes = ms / ONE_MINUTE | 0
	ms -= minutes * ONE_MINUTE
	if (hours > 0)
		return `${hours}h${twoDigits(minutes)}m`
	let seconds = ms / ONE_SECOND | 0
	return `${minutes}m${twoDigits(seconds)}s`
}

function twoDigits(n) {
	return n < 9 ? '0' + n : n
}

main()
	.catch(console.error)
	.then(process.exit)
