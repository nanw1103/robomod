const { log, error } = require('newheelog')()
const nodes = require('./nodes.js')
const settings = require('./settings.js')
const sync = require('./sync.js')
const config = require('../config.js')

let crawlTimer

function startCrawling() {
	clearTimeout(crawlTimer)
	log(`crawling: bootstrap=${config.bootstrap.length}, discovery=${Object.keys(nodes.unknown).length}, live=${Object.keys(nodes.live).length}, dormant=${Object.keys(nodes.dormant).length}`)
	sync()
		.catch(e => error('failed', e))
		.then(() => crawlTimer = setTimeout(startCrawling, settings.CRAWL_INTERVAL))
}

function start() {
	startCrawling()
}

module.exports = {
	start
}