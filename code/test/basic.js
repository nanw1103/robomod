function add(a, b) {
	return a + b
}

let aModuleScopeValue = 123

module.exports = {
	add,
	aModuleScopeValue
}
