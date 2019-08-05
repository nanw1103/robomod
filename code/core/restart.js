const log = require('newheelog')()
const stat = require('./stat.js')

module.exports = function exit(code) {
	code = code || 200
	log('Exiting with', code)

	stat.add('restart').save()

	setTimeout(() => process.exit(code), 200)
}