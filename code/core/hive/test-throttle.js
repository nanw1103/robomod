const throttle = require('./throttle.js')

function task(n) {
	return new Promise(resolve => {
		//setTimeout(() => {
		//    console.log(n)
		resolve(n)
		//}, 1)
	})
}

let throttledTask = throttle(task, {
	concurrency: 5000,
	perTimeSpan: 2000,
	timeSpanMs: 1000
})

setInterval(() => {
	console.log(throttledTask.queue, throttledTask.working)
}, 1000)

//let tasks = []
for (let i = 0; i < 10000; i++) {
	//tasks.push(throttledTask(i))
	throttledTask(i)
	//.then(console.log)
		.catch(console.error)
}
console.log(throttledTask.queue, throttledTask.working)
/*
Promise.all(tasks)
    .then(console.log)
    .catch(console.error)
*/