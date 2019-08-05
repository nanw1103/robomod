#!/bin/env node
require('./util/init.js')
const fs = require('fs')

console.log('Usage:')
console.log('    rbm <command> [target address] [arguments...]')
console.log('Available commands:')
let cmds = listCommands()
for (let i = 0; i < cmds.length; i++) {
	console.log('   ', cmds[i])
}

function listCommands() {

	const excludeList = [
	]

	let files = fs.readdirSync(__dirname)
	let names = []
	for (let name of files) {
		if (!name.endsWith('.js'))
			continue
		name = name.substring(0, name.length - '.js'.length)

		if (excludeList.includes(name))
			continue
		names.push(name)
	}
	return names
}
