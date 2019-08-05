const { log, error } = require('newheelog')()
const deepEqual = require('otherlib').deepEqual
const config = require('../core/config.js')
const peer = require('../core/rpc/client/peer.js')
const complexObj = require('./complexObj.js')
const basic = require('./basic.js')
const moduleFunc = require('./moduleFunc.js')

process.on('uncaughtException', err => {
	error('uncaughtException', err)
	process.exit(11)
}).on('unhandledRejection', (reason, p) => {
	error('Unhandled Rejection at: Promise', p, 'reason:', reason)
	process.exit(12)
})

let anyFailure
async function check(name, ret, expect, _propNameToCompare) {
	name = name.padEnd(18)

	try {
		ret = await ret
	} catch (e) {
		let msg
		if (e instanceof Error)
			msg = e.toString()
		else if (e.message)
			msg = e.message
		else
			msg = JSON.stringify(e)
		log.error(`    ${name}: EXCEPTION: ${msg}`)
		anyFailure = true
		return
	}

	let same
	if (_propNameToCompare) {
		same = deepEqual(ret[_propNameToCompare], expect[_propNameToCompare])
	} else {
		same = deepEqual(ret, expect)
	}

	if (same)
		log(`    ${name}: SUCCESS`)
	else {
		log.error(`    ${name}: FAIL. ret=${JSON.stringify(ret)}, expect=${expect}`)
		anyFailure = true
	}
}

async function checkThrow(name, promise, expect) {
	let ret
	try {
		ret = await promise
	} catch (e) {
		ret = e
	}

	let _propNameToCompare = expect instanceof Error ? 'message' : null
	return check(name, ret, expect, _propNameToCompare)
}


async function testBasic(endpoint) {

	log('================ BASIC ================')
	let target = endpoint.basic

	await check('basic value', target.aModuleScopeValue(), basic.aModuleScopeValue)
	await check('basic function', target.add(11, 22), basic.add(11, 22))
}

async function testFundamentals(endpoint) {

	log('================ FUNDAMENTALS ================')
	let target = endpoint.fundamentals

	log('>>> Test passing value '.padEnd(80, '-'))
	let testEcho = (name, v) => check(name, target.returnEcho(v), v)

	await testEcho('string', 'Hello')
	await testEcho('string.empty', '')
	await testEcho('bool.true', true)
	await testEcho('bool.false', false)
	await testEcho('null', null)
	//await testEcho('undefined', undefined)
	await testEcho('array.simple', [1,'asdf'])
	await testEcho('array.empty', [])
	//await testEcho('array.large', [...Array(1024 * 512).keys()])	//> Buffer.byteLength(JSON.stringify([...Array(1024*1024).keys()])) === 7277499
	await testEcho('array.large', [...Array(1024).keys()])
	await testEcho('array.complex', [-11, -2.0, -1, 0, 1, 2.0, 11, 'asdf', '', true, false, null, {x:42, o:{y:1}},])
	await testEcho('number.int', 123)
	await testEcho('number.-int', -123)
	await testEcho('number.0', 0)
	await testEcho('number.float', 123.456)
	await testEcho('number.-float', -123.456)
	await testEcho('number.NaN', NaN)
	await testEcho('number.Infinity', Infinity)
	await testEcho('number.-Infinity', -Infinity)
	await testEcho('object.simple', {a:1})
	await testEcho('object.empty', {})
	await testEcho('buffer', Buffer.from('asdf'))
	await testEcho('object.buffer', {buf: Buffer.from('asdf')})
	//await testEcho('object.undefined', {u: undefined})
	await testEcho('object.complex', complexObj)


	log('>>> Test throw '.padEnd(80, '-'))
	await check('promiseResolve', target.promiseResolve('yes'), 'yes')
	await checkThrow('promiseReject', target.promiseReject('demo_error'), 'demo_error')
	await check('asyncResolve', target.asyncResolve('yes'), 'yes')
	await checkThrow('asyncReject', target.asyncReject('demo_error'), 'demo_error')
	await checkThrow('throwError', target.throwError('demo_error'), new Error('demo_error'))
	await checkThrow('throwObj', target.throwObj('demo_error'), 'demo_error')

}

async function testInvalidCall(endpoint) {
	log('================ Invalid Call ================')
	//error: calling value with param
	await checkThrow('Invalid parameter', endpoint.basic.aModuleScopeValue(1), new Error('Invalid property call: /test/basic.aModuleScopeValue. Unexpected arguments: 0'))

	//error: inexist function
	await checkThrow('Inexist function', endpoint.basic.inexist(), new Error('Invalid call: /test/basic.inexist. No such method.'))

}

async function testModuleDirect(endpoint) {
	log('================ Module Func ================')
	await check('Module func', endpoint.moduleFunc(11, 22), moduleFunc(11, 22))
	await check('Module data', endpoint.complexObj(), complexObj)
}

async function testApiListing(endpoint) {
	log('================ API Listing ================')
	peer(endpoint)
	log('TODO: testApiListing')
}

async function main() {
	let host = config.http.host || 'localhost'
	let url = `http://${host}:${config.http.port}/robomod`
	log('Test target:', url)
	let p = peer(url).test

	await testBasic(p)
	if (anyFailure) {
		error('Failing basic test. Skipping others.')
	} else {
		await testFundamentals(p)
		await testInvalidCall(p)
		await testModuleDirect(p)
		await testApiListing(p)
	}

	log()
	if (anyFailure) {
		error('FAIL')
		process.exit(1)
	} else {
		log('SUCCESS')
		process.exit()
	}
}

main()
	.catch(error)
	.then(() => process.exit(2))