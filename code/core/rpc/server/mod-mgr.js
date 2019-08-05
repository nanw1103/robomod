const path = require('path')
const fs = require('fs')
const RpcError = require('./rpc-error.js')
//const log = require('newheelog')()

const CODE_PATH = path.resolve(path.join(__dirname, '../../..'))

function info(modPath) {
	let absPath = path.resolve(path.join(CODE_PATH, modPath))
	let absFile = absPath + '.js'

	let stat
	try {
		stat = fs.statSync(absFile)
	} catch (e) {
	}
	if (stat && stat.isFile())
		return getModInfo(absFile)

	stat = null
	try {
		stat = fs.statSync(absPath)
	} catch (e) {
	}

	if (stat && stat.isDirectory())
		return getDirInfo(absPath)
}

function getModInfo(filePath) {
	let m = require(filePath)
	let ret = {}
	if (typeof m === 'function') {
		let args = getArgs(m)
		ret['<default>'] = {
			type: 'function',
			args
		}
		return ret
	}
	for (let k in m) {
		let value = m[k]
		let type = typeof value
		if (type === 'function') {
			let args = getArgs(value)
			ret[k] = {
				type,
				args
			}
		} else {
			ret[k] = value
		}
	}
	return ret
}

function getDirInfo(dirPath) {
	let files = fs.readdirSync(dirPath)
	return files
}

function getArgs(func) {
	// First match everything inside the function argument parens.
	let matcher = func.toString().match(/function\s.*?\(([^)]*)\)/)
	if (!matcher)
		return []

	let args = matcher[1]

	// Split the arguments string into an array comma delimited.
	return args.split(',')
		.map(arg => arg.replace(/\/\*.*\*\//, '').trim())	// Ensure no inline comments are parsed and trim the whitespace.
		.filter(arg => arg)	// Ensure no undefined values are added.
}

function call(id, method, params) {

	let modPath = path.resolve(path.join(CODE_PATH, id + '.js'))
	let m
	try {
		m = require(modPath)
	} catch (e) {
		if (e.code === 'MODULE_NOT_FOUND' && method) {
			//try one deeper level
			return call(id + '/' + method, '', params)
		} else {
			throw e
		}
	}

	//log('->', id, method, params)
	if (method === '')
		return callImpl(m)
	if (!(method in m))
		throw new RpcError(`Invalid call: ${id}.${method}. No such method.`)
	return callImpl(m[method])

	function callImpl(target) {
		if (typeof target !== 'function') {
			let unexpected = Object.keys(params)
			if (unexpected.length > 0)
				throw new RpcError(`Invalid property call: ${id}.${method}. Unexpected arguments: ${unexpected}`)
			return target
		}

		let args
		if (Array.isArray(params)) {
			args = params
		} else {
			let argNames = getArgs(target)
			args = []
			for (let name of argNames) {
				args.push(params[name])
				delete params[name]
			}
			let unexpected = Object.keys(params)
			if (unexpected.length > 0)
				throw new RpcError(`Invalid call: ${id}.${method}. Unexpected arguments: ${unexpected}`)
		}
		return target(...args)
	}
}

module.exports = {
	info,
	call
}