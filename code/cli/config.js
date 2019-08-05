#!/bin/env node
require('./util/init.js')
const fs = require('fs')
const path = require('path')
const { deepGet, deepSet } = require('otherlib')

const configFile = '../core/config.js'
const configFileOriginal = path.join(__dirname, '../../config.js')

function loadConfig() {
	delete require.cache[require.resolve(configFile)]
	return require(configFile)
}

function showConfig() {
	let config = loadConfig()
	console.log(_stringify(config))
}

function showUsage() {
	console.log('Usage:')
	console.log('  rbm config [k=v]')
}

function updateConfig(name, value) {
	let config = loadConfig()

	let v = deepGet(config, name)
	if (v === undefined)
		return false

	deepSet(config, name, value)

	const updatedText = 'module.exports = ' + _stringify(config)
	fs.writeFileSync(configFileOriginal, updatedText)
	return true
}

function _stringify(obj) {
	return JSON.stringify(obj, null, 4)
		.replace(/"([^(")"]+)":/g,'$1:')
		.replace(/"/g, '\'')
}

module.exports = updateConfig

if (require.main === module) {

	let update = process.argv[2]
	if (!update) {
		showConfig()
		process.exit(0)
	}

	if (update.indexOf('=') < 0) {
		showUsage()
		process.exit(1)
	}

	let [k, v] = update.split('=')

	let success = updateConfig(k, v)
	if (!success) {
		console.error('Configure not found:', k)
		process.exit(2)
	}
}