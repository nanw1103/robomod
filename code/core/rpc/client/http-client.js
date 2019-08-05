const axios = require('axios')
const serializer = require('../serializer.js')
const stat = require('../../stat.js')

const defaults = {
	options: {
		timeout: 15000,
		validateStatus: status => status >= 200 && status < 300,

		// `transformRequest` allows changes to the request data before it is sent to the server
		// This is only applicable for request methods 'PUT', 'POST', and 'PATCH'
		// The last function in the array must return a string or an instance of Buffer, ArrayBuffer,
		// FormData or Stream
		// You may modify the headers object.
		transformRequest (data, _headers) {
			// Do whatever you want to transform the data
			//console.log('transformRequest', data)
			let serializedData = serializer.serialize(data)
			//console.log('serializedData', serializedData)
			return serializedData
			//return data
		},

		// `transformResponse` allows changes to the response data to be made before
		// it is passed to then/catch
		transformResponse (data) {
			// Do whatever you want to transform the data

			//console.log('transformResponse', data)
			return serializer.deserialize(data)
			//return data
		},
	},
	headers: {
		'content-type': 'application/modrpc-rich-json'
	}
}

function request(options) {
	options = { ...defaults.options, ...options }
	options.headers = { ...defaults.headers, ...options.headers}
	return axios(options)
		.then(data => {
			stat.countBytes(data.request.socket.bytesRead, data.request.socket.bytesWritten)	//TODO: this may not be accurate
			return data
		})
		.catch(e => Promise.reject(simplifyAxiosError(e)))
}

function simplifyAxiosError(e) {
	if (!e.config)
		return e
	e.config = {
		headers: e.config.headers,
		method: e.config.method,
		url: e.config.url,
		data: e.config.data
	}

	if (e.request) {
		e.request = {
			_header: e.request._header
		}
	}

	if (e.response) {
		e.response = {
			status: e.response.status,
			statusText: e.response.statusText,
			headers: e.response.headers,
			data: e.response.data
		}
	}
	return e
}

function post(url, data, headers, timeout) {
	let options = {
		method: 'POST',
		url,
		data,
		headers
	}
	if (timeout)
		options.timeout = timeout
	return request(options)
}

module.exports = {
	request,
	post
}