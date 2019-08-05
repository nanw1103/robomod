const { error } = require('newheelog')
const ModFile = require('./data/mod-file.js')

let data = init()
let transient = {
	bytesRead: 0,
	bytesWritten: 0
}

const inst = {
	data,
	transient,
	get bps() { return bps() },

	add,
	addTransient,
	countBytes,
	save
}

function init() {
	let file = ModFile('stat', 'json')
	return file.load({})
}

function save() {
	let file = ModFile('stat', 'json')
	try {
		file.save(data)
	} catch (e) {
		error(e)
	}
	return inst
}

function add(name, value) {
	value = value || 1
	if (!data[name])
		data[name] = value
	else
		data[name] += value
	return inst
}

function addTransient(name, value) {
	value = value || 1
	if (!transient[name])
		transient[name] = value
	else
		transient[name] += value
	return inst
}

function countBytes(bytesRead, bytesWritten) {
	if (bytesRead) {
		transient.bytesRead += bytesRead
	}

	if (bytesWritten) {
		transient.bytesWritten += bytesWritten
	}
	return inst
}

const bpsHelper = {
	sampleData: {
		bytesRead: 0,
		bytesWritten: 0
	},
	sampleTimer: 0,
	result: {
		in: 0,
		out: 0
	}
}

function bps() {

	const INTERVAL_SECONDS = 2

	if (!bpsHelper.sampleTimer) {
		bpsHelper.sampleData.bytesRead = transient.bytesRead
		bpsHelper.sampleData.bytesWritten = transient.bytesWritten
		bpsHelper.sampleTimer = setTimeout(captureBps, INTERVAL_SECONDS * 1000)
	}

	return bpsHelper.result

	function captureBps() {
		bpsHelper.sampleTimer = 0
		bpsHelper.result.in = (transient.bytesRead - bpsHelper.sampleData.bytesRead) / INTERVAL_SECONDS | 0
		bpsHelper.result.out = (transient.bytesWritten - bpsHelper.sampleData.bytesWritten) / INTERVAL_SECONDS | 0
	}
}

module.exports = inst