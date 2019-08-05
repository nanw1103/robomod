#!/bin/env node
require('./util/init.js')
const local = require('./util/local.js')
const formatTable = require('./util/format-table.js')

async function main() {
	let instance = await local.core.instance()

	let text
	if (process.argv[3] === 'version') {
		text = formatVersion(instance)
	} else {
		text = JSON.stringify(instance, null, 4)
	}
	console.log(text)
}

function formatVersion(instance) {
	let versionObj = instance.version

	let rows = []
	for (let name in versionObj) {
		let details = versionObj[name]
		details.name = name
		rows.push(details)
	}

	let headers = [
		'name',
		'version',
		'hash'
	]
	let options = {
		header: false,
		footer: false
	}
	return formatTable(rows, headers, options)
}

main()
	.catch(console.error)
	.then(process.exit)