const newheelog = require('newheelog')
newheelog.config({decorateConsole: false})
const log = newheelog()

process.on('uncaughtException', err => {
	log.error('uncaughtException', err)
	process.exit(11)
}).on('unhandledRejection', (reason, p) => {
	log.error('Unhandled Rejection at: Promise', p, 'reason:', reason)
	process.exit(12)
})
