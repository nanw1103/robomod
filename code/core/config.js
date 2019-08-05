const config = require('../../config.js')
const bootstrap = require('./bootstrap.js')

function overrideConfigByArgs() {
	for (let i = 2; i < process.argv.length; i++) {
		let arg = process.argv[i]
		if (!arg.startsWith('--config.'))
			continue
		arg = arg.substring('--config.'.length)
		const [prop, value] = arg.split('=')
		override(config, prop, value)
	}
}

function override(obj, prop, value) {

	let parts = prop.split('.')
	for (let i = 0; i < parts.length; i++) {
		let k = parts[i]
		if (i === parts.length - 1) {
			let newVal = toPrimitive(value)
			if (obj[k] !== newVal) {
				obj[k] = newVal
				console.log('override', prop, value)
			}
			return
		}
		if (!obj[k])
			obj[k] = {}
		obj = obj[k]
	}
}

function toPrimitive(str) {
	let tmp = str.toLowerCase().trim()
	if (tmp === 'true')
		return true
	if (tmp === 'false')
		return false

	let n = Number.parseInt(tmp)
	if (String(n) === tmp)
		return n
	n = Number.parseFloat(tmp)
	if (String(n) === tmp)
		return n

	if (tmp === 'null')
		return null
	if (str === 'Infinity')
		return Infinity
	if (str === '-Infinity')
		return -Infinity
	if (str === 'NaN')
		return NaN
	return str
}

function updateBootstrap() {
	if (config.profile === 'dev') {
		console.log('config.profile===dev, skip updateBootstrap')
		return
	}
	let nodes = new Set(config.bootstrap)
	bootstrap.forEach(a => nodes.add(a))
	config.bootstrap = Array.from(nodes)
}

overrideConfigByArgs()
updateBootstrap()

module.exports = config