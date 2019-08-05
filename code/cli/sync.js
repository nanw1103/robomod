#!/bin/env node
require('./util/init.js')
const local = require('./util/local.js')

async function main() {
	let category = process.argv[3]

	try {
		await local.core.hive.sync(category)
	} catch (e) {
		console.info(e.toString())
	}
}

main()
	.catch(console.error)
	.then(process.exit)