const client = require('./http-client.js')
const stat = require('../../stat.js')

function peer(addr, options) {
	let actualAddr = addr.indexOf('/') < 0 ? `http://${addr}/robomod` : addr

	function dotFn(actualFn, callPath) {
		let wrappedFn = function(...args) {
			return actualFn(callPath, args)
		}
		return new Proxy(wrappedFn, {
			get (target, k) {
				if (k === '_address')
					return addr
				let newPath = (callPath || '') + '/' + k
				return dotFn(actualFn, newPath)
			}
		})
	}

	let timeout = options ? options.timeout : undefined

	return dotFn((path, args) => {
		//console.log('CALL', addr, path, args)

		let i = path.lastIndexOf('/')
		let url = actualAddr + path.substring(0, i)
		url += ':' + path.substring(i + 1)

		stat.add('rpc.client.call')

		let headers = {
			//'x-rbm-id': process.env.robomod_id
		}
		return client.post(url, args, headers, timeout)
			.then(ret => {
				if (ret.headers['x-rbmrpc-err'])
					return Promise.reject(ret.data)
				return ret.data
			})
	})
}

module.exports = peer