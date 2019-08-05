const http = require('http')
const log = require('newheelog')()
const config = require('./instance.js').config
const httpApi = require('./rpc/server/http-api.js')
const hive = require('./hive/index.js')

let server = http.createServer()
httpApi.init(server)
server.listen(config.http.port, config.http.host, err => {
	if (err)
		throw err
	log(`Live on ${config.http.host || '*'}:${config.http.port}`)

	hive.start()
})