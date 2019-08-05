#!/bin/env node
require('./util/init.js')
const local = require('./util/local.js')
const unitTest = require('./ut.js')

local.core.quit()
	.catch(e => console.log(e.toString()))
	.then(unitTest)
	.then(success => {
		if (!success) {
			console.error('UT failed. Stop')
			process.exit(1)
			return
		}

		console.log('=============================================')
		require('../../forever.js')
	})