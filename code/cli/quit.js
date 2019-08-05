#!/bin/env node
require('./util/init.js')
const local = require('./util/local.js')
console.log('Quit', local._address)
local.core.quit()
	.then(process.exit)
	.catch(e => console.error(e.toString()))
	.then(() => process.exit(2))