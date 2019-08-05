function encodeBuffer(obj) {
	return {
		_rbmRpcType: 'Buffer',
		data: obj.toString('base64')
	}
}

function serialize(value) {
	if (value instanceof Buffer)
		return JSON.stringify(encodeBuffer(value))
	if (value === undefined)
		return '{"_rbmRpcType":"undefined"}'

	return JSON.stringify(value, function (k, v) {
		//console.log('--', k, v)
		if (typeof v === 'object' && v) {
			let replace = Array.isArray(v) ? new Array(v.length) : {}
			for (let key in v) {
				if (v[key] instanceof Buffer)
					replace[key] = encodeBuffer(v[key])
				//else if (v[key] === undefined)
				//	replace[key] = { _rbmRpcType: 'undefined' }
				else
					replace[key] = v[key]
			}
			return replace
		} else if (Number.isNaN(v)) {
			return { _rbmRpcType: 'NaN' }
		} else if (v === Infinity) {
			return { _rbmRpcType: 'Infinity' }
		} else if (v === -Infinity) {
			return { _rbmRpcType: '-Infinity' }
		}

		return v
	})
}

function deserialize(text) {
	return JSON.parse(text, function (k, v) {
		if (v && v._rbmRpcType) {
			switch (v._rbmRpcType) {
			case 'Buffer':	return Buffer.from(v.data, 'base64')
			case 'NaN': return NaN
			case 'Infinity': return Infinity
			case '-Infinity': return -Infinity
			case 'undefined': return undefined
			default: throw 'Unknown _rbmRpcType: ' + v._rbmRpcType
			}
		} else {
			return v
		}
	})
}

module.exports = {
	serialize,
	deserialize
}


/*
const deepEqual = require('otherlib').deepEqual

let s
s=serialize(Buffer.from('asdf'))
console.log(s)
console.log(deserialize(s))

s=serialize({a:{b:Buffer.from('asdf')}})
console.log(s)
console.log(deserialize(s))


let s

//s = serialize(undefined)
//console.log(s)
//console.log(deserialize(s))

s = serialize({u:undefined})
console.log(s)
console.log(deserialize(s))

console.log(serialize())
console.log(deserialize(serialize()))
*/
