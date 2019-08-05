const config = require('./config.js')

const instance = require('./instance.js')
require('./init.js')
const log = require('newheelog')()

if (!config.geo) {
	console.error('config.geo not specified.')
	process.exit(201)
}
showInfo()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

require('../patch').then(() => require('./server.js'))

function showInfo() {
	log('--------------------------------------------------------------------------')
	log(`    ID: ${instance.id}`)
	log(`  Desc: ${config.description}`)
	log(`   Geo: ${config.geo}`)
	log(`   Ver: ${instance.hash}`)
	let versions = instance.version
	for (let k in versions) {
		if (k === '.')
			continue
		log(`       ${k.padStart(12)}: ${versions[k].version}`)
	}
	log('--------------------------------------------------------------------------')
}
