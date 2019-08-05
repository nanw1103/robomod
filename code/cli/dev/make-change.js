const fs = require('fs')
const path = require('path')

const testDir = path.join(__dirname, '../../test')
const files = [
	'pubtest.txt',
	'deep/changed.txt',
	'deep/changed/changed/changed.txt',
	'new.txt'
]
for (let file of files)
	fs.writeFileSync(path.join(testDir, file), '' + Math.random())

module.exports = testDir