const path = require('path')
const fs = require('fs')
const { log, error } = require('newheelog')()
const modFile = require('../core/data/mod-file.js')
const patchRecordFile = modFile('patch-record')
const patchRecord = patchRecordFile.load({})

async function patch() {
	try {
		let changed = await patchImpl()
		if (changed) {
			log('Patch applied. Restart')
			process.exit(200)
		}
	} catch (e) {
		error('Patch failed:', e)
	}
}

async function patchImpl() {
	let changed = false
	const files = fs.readdirSync(__dirname).sort()
	for (let name of files) {
		if (!name.endsWith('.js') || name === 'index.js')
			continue
		let filePath = path.join(__dirname, name)
		let stat = fs.statSync(filePath)
		if (!stat.isFile())
			continue

		let record = patchRecord[name]
		if (record)
			continue

		if (await applyPatch(name))
			changed = true
	}
	return changed
}

async function applyPatch(name) {
	log('Apply patch start:', name)
	let record = {
		date: new Date
	}
	let changed
	try {
		let fn = require(path.join(__dirname, name))
		record.result = await fn()
		log('Apply patch success:', name)
		changed = true
	} catch (e) {
		record.error = e.toString()
		log('Apply patch failed:', record.error)
	}

	patchRecord[name] = record
	patchRecordFile.save()
	return changed
}

module.exports = patch()