#!/bin/env node
const fs = require('fs')
const path = require('path')
const fork = require('child_process').fork
const args = process.argv.slice(2)

const BASE_DIR = __dirname

const options = {
	cwd: BASE_DIR,
	execArgv: [
		'--throw-deprecation',
		'--trace-warnings',
		'--use_strict'
	]
}

if (args.indexOf('silent') >= 0)
	options.stdio = 'ignore'

function logExit(code, signal) {
	code = code || 'Signal ' + signal
	let msg = 'Exit ' + code + ': '
	if (code === 200)
		msg += 'Normal quit. Restart...'
	else if (code === 201)
		msg += 'Force quit. No respawn.'
	else
		msg += 'Unknown exit.'
	msg += '\n'
	try {
		fs.appendFileSync(path.join(BASE_DIR, 'log/console.log'), msg)
	} catch (e) {
		console.error(e)
	}
}

function forever() {
	let exited = false
	fork('code/index.js', args, options)
		.on('close', onExit)
		.on('error', onExit)
		.on('exit', onExit)

	function onExit(code, signal) {
		if (exited)
			return
		exited = true
		logExit(code, signal)
		if (code !== 201)
			setTimeout(forever, 1000)
	}
}

forever()
