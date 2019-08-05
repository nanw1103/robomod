const url = require('url')
const querystring = require('querystring')
const stat = require('../../stat.js')
//const log = require('newheelog')()
//const connect = require('connect')
const serializer = require('../serializer.js')
const modMgr = require('./mod-mgr.js')

const POST_LENGTH_LIMIT = 1024 * 1024 * 8
const CONTEXT_BASE = '/robomod'

function parseReq(req) {
	let parsed = url.parse(req.url)
	let ret = {
		headers: req.headers
	}

	let path = parsed.pathname

	if (!path.startsWith(CONTEXT_BASE))
		return
	path = path.substring(CONTEXT_BASE.length)

	if (path === '' || path === '/') {
		path = '/'
	} else {
		if (path[0] !== '/')
			return

		//remove trailing '/' if any
		if (path[path.length - 1] === '/')
			path = path.substring(0, path.length - 1)

		let indexOfColon = path.lastIndexOf(':')

		if (indexOfColon > 0) {
			ret.method = path.substring(indexOfColon + 1)
			path = path.substring(0, indexOfColon)
		}
	}
	ret.path = path

	let query
	if (parsed.query) {
		query = querystring.parse(parsed.query)
		for (let k in query) {
			try {
				query[k] = JSON.parse(query[k])
			} catch (e) {
			}
		}
	} else {
		query = {}
	}
	ret.query = query

	ret.remoteAddress //req.headers['x-forwarded-for']
		= req.connection.remoteAddress
		|| req.socket.remoteAddress
		|| req.connection.socket.remoteAddress
	return ret
}

function consumeBody(req, callback) {
	let body
	req.on('data', function (data) {
		if (data instanceof Buffer)	//TODO
			data = data.toString('utf8')

		if (body === undefined)
			body = data
		else
			body += data
		if (body.length > POST_LENGTH_LIMIT)
			return callback(413)
	}).on('end', () => {
		if (!body) {
			return callback(null, body)
		}
		try {
			return callback(null, convertContent(req.headers['content-type'], body))
		} catch (e) {
			return callback({
				code: 400,
				message: e.toString()
			})
		}
	})

	function convertContent(type, data) {
		if (type === 'application/modrpc-rich-json') {
			//log('body', data)
			let decodedBody = serializer.deserialize(data)
			//log('decodedBody', decodedBody)
			return decodedBody
		}
		return data
	}
}

async function callModule(parsedReq) {

	stat.add('rpc.server.call')

	let id = parsedReq.path
	let method = parsedReq.method
	let params = parsedReq.body
	if (!params)
		params = parsedReq.query
	else if (Object.keys(parsedReq.query).length > 0)
		throw Error('Parameters in both body and query are prohibited')

	return modMgr.call(id, method, params)
	/*
	log(`-> ${id}.${method}: ${JSON.stringify(params)}`)
	try {
		let ret = await modMgr.call(id, method, params)
		log(`<- ${JSON.stringify(ret)}`)
		return ret
	} catch (e) {
		log(`<- THROW ${e.toString()}`)
		throw e
	}
	//*/
}

function sendJson(res, data, code, headers) {
	//let text = JSON.stringify(data)
	let text = serializer.serialize(data)
	code = code || 200
	headers = {'Content-Type': 'text/plain',
		'Content-Length': Buffer.byteLength(text), ...headers}

	res.writeHead(code, headers)
	res.end(text)

	//count bytes
	let conn = res.connection
	let bytesRead = conn.bytesRead - (conn.__bytesRead || 0)
	let bytesWritten = conn.bytesWritten - (conn.__bytesWritten || 0)
	stat.countBytes(bytesRead, bytesWritten)
	conn.__bytesRead = conn.bytesRead
	conn.__bytesWritten = conn.bytesWritten
}

function sendError(res, error) {
	if (!error)
		error = {}

	if (error instanceof Error) {
		console.log(error)
		error = {
			name: error.name,
			message: error.message,
			...error,
			stack: error.stack
		}
	}

	sendJson(res, error, 200, {
		'x-rbmrpc-err': error.code || 500
	})
}

function init(httpServer) {
	httpServer.on('request', (req, res) => {
		req.setTimeout(15000)
		res.setTimeout(15000)

		let parsed = parseReq(req)
		if (!parsed) {
			sendError(res, {
				code: 400,
				message: 'Fail parsing request'
			})
			return
		}

		//console.log('parsedReq', parsed)

		//list api
		if (parsed.method === undefined) {
			try {
				let info = modMgr.info(parsed.path)
				if (info)
					return sendJson(res, info)
				return sendError(res, {
					code: 404,
					message: 'Mod not found'
				})
			} catch (e) {
				return sendError(res, e)
			}
		}

		//call mod
		consumeBody(req, function (err, body) {
			if (err)
				return sendError(res, err)
			parsed.body = body
			callModule(parsed)
				.then(result => sendJson(res, result))
				.catch(error => sendError(res, error))
		})
	})
}

module.exports = {
	init
}