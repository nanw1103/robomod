#!/bin/env node
require('./util/init.js')
const { log } = require('newheelog')()
const path = require('path')
const fs = require('fs')
const MetaFile = require('../core/update/sync-dir/meta-file.js')

function updateVersionAndHash(folder, keepVersion) {

	const meta = new MetaFile(folder)
	let version = meta.summary.version.padEnd(10)

	let name = folder.substring(folder.lastIndexOf(path.sep) + 1).padEnd(16)
	let bumpVersion = !keepVersion
	let changed = meta.rehash(bumpVersion)
	let newVersion
	if (!changed) {
		newVersion = '(same)'
	} else {
		newVersion = meta.summary.version
		meta.save()
	}
	newVersion = newVersion.padEnd(10)
	log(name, version, '->', newVersion, meta.summary.hash)
}

function rehash(keepVersion) {
	let dir = path.join(__dirname, '../')
	if (!fs.existsSync(dir))
		throw new Error('Path does not exist: ' + dir)

	//do update if necessary
	log('Checking', dir)
	let files = fs.readdirSync(dir)
	for (let name of files) {
		let sub = path.join(dir, name)
		let stat = fs.statSync(sub)
		if (!stat.isDirectory())
			continue

		updateVersionAndHash(sub, keepVersion)
	}
}

module.exports = rehash

if (require.main === module) {
	let keepVersion = process.argv[2]
	rehash(keepVersion)
}
