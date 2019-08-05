const newheelog = require('newheelog')

//----------------------------------------------------------------------
//	Init logger
//----------------------------------------------------------------------

let loggerConfig = {
	decorateConsole: true,			//whether decorate console.log/console.error. Default: true
	writeToConsole: true,			//whether write to console for log operations. Default: true
	fileName: './log/console.log',				//log file. If null, no log file will be created. Default: null
	//maxLength: 4 * 1024 * 1024,	//max file length
	//maxFiles: 3,					//max log files to keep
	//custom: () => 'custom-label-' + process.pid,		//A function to append custom label. E.g. add pid
	maskPassword: false,
	moduleNamePadding: 14,
	longLevelName: true,
	colorizeConsole: true,
}

if (process.env.ROBOMOD_CHILD_ID)
	loggerConfig.custom = () => process.env.ROBOMOD_CHILD_ID

newheelog.config(loggerConfig)

const { error } = newheelog()

//----------------------------------------------------------------------
//	On error, log & crash
//----------------------------------------------------------------------
process.on('uncaughtException', err => {
	error('uncaughtException', err)
	process.exit(11)
}).on('unhandledRejection', (reason, p) => {
	error('Unhandled Rejection at: Promise', p, 'reason:', reason)
	process.exit(12)
})
