#!/bin/env node
require('./util/init.js')
const fse = require('fs-extra')
const path = require('path')
const {log, warn, error} = require('newheelog')()
const peer = require('../core/rpc/client/peer.js')
const fork = require('child_process').fork
const spawnN = require('./spawnN.js')
const rehash = require('./rehash.js')
const MetaFile = require('../core/update/sync-dir/meta-file.js')
const version = require('../core/update/sync-dir/version.js')

const delay = millis => new Promise(resolve => setTimeout(resolve, millis))

const RBM_SPAWN_DIR = path.join(__dirname, '../../../rbm-spawn')

let result = {
	startup: false,
	basic: false,
	peers: false,

	downgrade: false,
	pullSync: false,

	upgrade: false,
	pushSync: false
}

rehash()
const myTestVersion = new MetaFile(path.join(__dirname, '../test')).summary.version
const p0 = peer('localhost:20000')
const p1 = peer('localhost:20001')
const p2 = peer('localhost:20002')

async function main() {
	await spawnN(3)
	await delay(1000)

	await waitForVersion(p0, myTestVersion)
	await waitForVersion(p1, myTestVersion)
	await waitForVersion(p2, myTestVersion)

	result.startup = true
	log('success: startup')

	//
	//  Test BASIC
	//
	await testBasic(20000)
	result.basic = true
	log('success: basic test')

	await testPeers()
	result.peers = true
	log('success: testPeers')

	//
	//  Test sync - pull
	//
	let dir = path.join(RBM_SPAWN_DIR, '20001/code/cli')
	log('Downgrading...')

	//downgrade v1
	await callModule(dir + '/dev/downgrade.js', {cwd: dir})

	//wait for v1 start
	await waitForVersion(p1, '0.0.1')
	result.downgrade = true
	log('success: downgrade')

	//wait for v1 sync
	await waitForVersion(p1, myTestVersion)
	result.pullSync = true
	log('success: pull sync')

	//
	//  Test sync - push
	//
	log('Upgrading...')
	//upgrade v1
	await callModule(dir + '/dev/upgrade.js', {cwd: dir})

	let expected = version(myTestVersion).bump().toString()

	//wait for v1 start
	await waitForVersion(p1, expected)
	result.upgrade = true
	log('success: upgraded')

	//wait for v0 & v2 sync
	await waitForVersion(p0, expected)
	await waitForVersion(p2, expected)
	result.pushSync = true
	log('success: push sync')
}

async function testBasic(port) {
	let options = {
		env: {},
		execArgv: []
	}
	let modDir = path.join(RBM_SPAWN_DIR, `${port}/code/test/test.js`)
	return callModule(modDir, options)
}

async function testPeers() {
	let p0Peers = await p0.core.hive.nodes.live()
	let p1Peers = await p1.core.hive.nodes.live()
	let p2Peers = await p2.core.hive.nodes.live()
	let numP0Peers = Object.keys(p0Peers).length
	let numP1Peers = Object.keys(p1Peers).length
	let numP2Peers = Object.keys(p2Peers).length
	if (numP0Peers === 2 || numP1Peers === 2 || numP2Peers === 2) {
		result.peers = true
	} else {
		warn('p0Peers', p0Peers)
		warn('p1Peers', p2Peers)
		warn('p2Peers', p2Peers)
		throw new Error('Incorrect peers. Some other nodes connected?')
	}
}

async function waitForVersion(remote, expected) {
	expected = String(expected)
	let v
	let addr = remote._address
	for (let i = 0; i < 10; i++) {
		try {
			v = (await remote.core.instance.version()).test.version
			log(`Waiting for version: ${addr} - current=${v} -> expected=${expected} (${i}/10)`)
			if (v === expected)
				return
		} catch (e) {
		}
		await delay(2000)
	}
	return Promise.reject(`Fail waiting for ${addr} version: expected=${expected}, actual=${v}`)
}

function callModule(filePath, options) {
	if (!options)
		options = {}
	if (!options.cwd)
		options.cwd = path.dirname(filePath)
	return new Promise((resolve, reject) => {
		fork(filePath, [], options)
			.on('close', onExit)
			.on('error', onExit)
			.on('exit', onExit)

		function onExit(codeOrError, signal) {
			let msg = `Sub module exits - ${filePath}: ${(codeOrError === null ? 'signal ' + signal : codeOrError)}`
			log(msg)

			if (codeOrError === 0)
				resolve()
			else
				reject(codeOrError || signal)
		}
	})
}

function quitTests() {

	log('quitTests')

	let addrs = [
		'localhost:20000',
		'localhost:20001',
		'localhost:20002',
	]
	let tasks = addrs.map(a => peer(a).core.quit().catch(error))
	return Promise.all(tasks)
}

async function cleanup() {
	try {
		await quitTests()
	} catch (e) {
		error(e)
	}

	await delay(1000) //todo: wait for spawnN

	if (anyFailure())
		return

	log('Cleanup test dirs')
	try {
		fse.removeSync(RBM_SPAWN_DIR)
	} catch (e) {
		error(e)
	}
}

function report() {
	log()
	log('------------- TEST RESULT --------------')
	let exitCode = 0
	for (let k in result) {
		if (result[k])
			log(k.padEnd(9) + ':', 'SUCCESS')
		else {
			error(k.padEnd(9) + ':', 'FAILED')
			exitCode = 1
		}
	}
	return exitCode
}

function anyFailure() {
	for (let k in result)
		if (!result[k])
			return true
}

function ut() {
	return main()
		.catch(error)
		.then(cleanup)
		.then(report)
		.then(() => !anyFailure())
}

module.exports = ut

if (require.main === module) {
	ut().then(success => process.exit(success ? 0 : 1))
}