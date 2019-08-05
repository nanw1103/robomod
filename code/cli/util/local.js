const peer = require('../../core/rpc/client/peer.js')
const config = require('../../core/config.js')

let url = process.argv[2]
if (url) {
	if ('' + parseInt(url) === url)
		url = `http://localhost:${url}/robomod`
} else {
	let host = config.http.host || 'localhost'
	url = `http://${host}:${config.http.port}/robomod`
}
module.exports = peer(url)