const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const config = require('./config.js')
const MetaFile = require('./update/sync-dir/meta-file.js')
const ModFile = require('./data/mod-file.js')

//1545720315452
let totalHash
const init = birth()
const inst = {
	id: init.id,
	start: Date.now(),
	get now() {	return Date.now() },
	birthday: init.birthday,
	genesis: init.birthday,
	config,
	hash: '<to-be-calculated>',
	version: getVersion(),
}

function birth() {
	let file = ModFile('birth')
	let data = file.load()

	if (!data) {
		data = {
			id: Math.random().toString(36).slice(2).padStart(12, '0'),
			birthday: Date.now()
		}
		file.save(data)
	}
	return data
}

function getVersion() {
	let ret = {}
	let hasher = crypto.createHash('md5')
	let repos = path.resolve(path.join(__dirname, '..'))

	let files = fs.readdirSync(repos).sort()

	for (let name of files) {
		let dir = path.join(repos, name)
		let stat = fs.statSync(dir)
		if (!stat.isDirectory())
			continue
		let info = getDirVersion(dir)
		ret[name] = info

		hasher.update(name)
		hasher.update(info.version)
		hasher.update(info.hash)
	}

	//for newer version nodejs
	/*
	let dirents = fs.readdirSync(repos, {withFileTypes:true})
		.sort((a, b) => a.name.localeCompare(b.name))

	for (let file of dirents) {
		let dir = path.join(repos, file.name)
		if (!file.isDirectory())
			continue
		let info = getDirVersion(dir)
		ret[file.name] = info

		hasher.update(file.name)
		hasher.update(info.version)
		hasher.update(info.hash)
	}
	*/
	totalHash = hasher.digest('hex')

	//make sure node_modules & core are at the top
	let node_modules = ret.node_modules
	delete ret.node_modules
	let core = ret.core
	delete ret.core
	return {
		node_modules,
		core,
		...ret
	}
}

function getDirVersion(dir) {
	let meta = new MetaFile(dir)
	return {
		version: meta.summary.version,
		hash: meta.summary.hash
	}
}

inst.hash = totalHash
process.env.robomod_id = inst.id
module.exports = inst
