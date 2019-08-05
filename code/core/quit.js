const log = require('newheelog')()

module.exports = function quit() {
	log('Quit with 201')
	setTimeout(() => process.exit(201), 200)
}