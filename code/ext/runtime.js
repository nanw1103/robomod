function getProcessInfo() {
	return {
		arch: process.arch,
		argv: process.argv,
		config: process.config,
		cpuUsage: process.cpuUsage(),
		cwd: process.cwd(),
		domain: process.domain,
		env: process.env,
		execArgv: process.execArgv,
		execPath: process.execPath,
		features: process.features,
		memoryUsage: process.memoryUsage(),
		moduleLoadList: process.moduleLoadList,
		pid: process.pid,
		platform: process.platform,
		ppid: process.ppid,
		title: process.title,
		uptime: process.uptime() | 0,
		versions: process.versions,
	}
}

module.exports = {
	get process() {
		return getProcessInfo()
	}
}//comment
