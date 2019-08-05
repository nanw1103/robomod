function returnEcho(val) {
	return val
}

function promiseResolve(o) {
	return Promise.resolve(o)
}

function promiseReject(e) {
	return Promise.reject(e)
}

function asyncResolve(o) {
	return o
}

function asyncReject(e) {
	return Promise.reject(e)
}

function throwError(msg) {
	throw new Error(msg)
}

function throwObj(obj) {
	throw obj
}

let state = 0
function modifyState() {
	return state++
}

module.exports = {
	returnEcho,

	promiseResolve,
	promiseReject,
	asyncResolve,
	asyncReject,

	throwError,
	throwObj,
	modifyState
}
