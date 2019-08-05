#!/bin/env node
require('./util/init.js')
const fse = require('fs-extra')
const path = require('path')
const peer = require('../core/rpc/client/peer.js')
const fork = require('child_process').fork
const delay = require('otherlib').delay

const newheelog = require('newheelog')
newheelog.config({ custom: 'MSTER' })
const {log, error} = newheelog()

const BASE_DIR = path.join(__dirname, '../../')
process.chdir(BASE_DIR)

require('./clean.js')

async function spawn1(port, isProd) {
	log('child', port)
	await closeInstance(port)
	let instanceDir = copyInstanceFolder(port, isProd)

	forever(instanceDir, port)
}

function forever(instanceDir, port) {

	foreverImpl()

	function foreverImpl() {
		spawn().then(onProcessExit)
	}

	function spawn() {
		return new Promise(resolve => {
			fork(path.join(instanceDir, 'code/index.js'), [], {
				cwd: instanceDir,
				env: {
					ROBOMOD_CHILD_ID: port
				},
				execArgv: [
					'--throw-deprecation',
					'--trace-warnings',
					'--use_strict'
				]
			}).on('close', onExit)
				.on('error', onExit)
				.on('exit', onExit)

			function onExit(code, signal) {
				resolve(code || 'signal ' + signal)
			}
		})
	}

	let restartTimer
	function onProcessExit(code) {
		let msg = `Instance ${port} exits ${code}: `
		if (code === 200) {
			msg += 'Normal quit. Restart...'
		} else if (code === 201) {
			msg += 'Force quit. No respawn.'
		} else {
			msg += 'Unknown exit.'
		}
		log(msg)
		try {
			fse.appendFileSync(path.join(instanceDir, 'log/log.txt'), msg)
		} catch (e) {
			error(e)
		}

		clearTimeout(restartTimer)
		if (code !== 201)
			restartTimer = setTimeout(foreverImpl, 1000)
	}
}

async function closeInstance(port) {
	try {
		await peer(`http://127.0.0.1:${port}/robomod`).core.quit()
		log('Instance closed:', port)
	} catch (e) {
	}
}

function copyInstanceFolder(port, isProd) {
	let instanceDir = path.join(BASE_DIR, '../rbm-spawn/' + port)
	fse.removeSync(instanceDir)
	fse.copySync(BASE_DIR, instanceDir)

	//update port in config
	let k = require.resolve(path.join(instanceDir, 'config.js'))
	delete require.cache[k]
	let instanceConf = require(k)
	instanceConf.http.port = port

	if (isProd) {
		//for prod
		instanceConf.geo = instanceConf.geo + '#' + port
	} else {
		//for UT
		instanceConf.geo = 'ut' + port
		instanceConf.bootstrap = ['127.0.0.1:20000']
		instanceConf.profile = 'dev'
	}
	fse.writeFileSync(k, 'module.exports=' + JSON.stringify(instanceConf, null, 4))
	delete require.cache[k]
	return instanceDir
}

async function spawnN(n, startingPort=20000, isProd) {
	for (let i = 0; i < n; i++) {
		let port = startingPort + i
		log('Spawning', port)
		await spawn1(port, isProd)
		await delay(1000)
	}
}

module.exports = spawnN

if (require.main === module) {
	let n = parseInt(process.argv[2])
	if (!n) {
		log('Usage: rbm spawnN.js <numOfInstances> [startingPort] [isProd]')
		process.exit(1)
	}
	let startingPort = Number.parseInt(process.argv[3]) || 20000
	let isProd = process.argv[4]
	spawnN(n, startingPort, isProd)
		.catch(log.error)
}
