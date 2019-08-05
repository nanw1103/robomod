const complexObj = {
	a: 1,
	b: true,
	e: '',
	f: -1.0,
	n: null,
	s: 'hello',
	//u: undefined,
	dummy: {},
	buf: Buffer.from('asdf'),
	nan: NaN,
	i: Infinity,
	i2: -Infinity,
	arr: [-11, -2.0, -1, 0, 1, 2.0, 11, 'asdf', '', true, false, null, {x:42, o:{y:1}}, Buffer.from('asdf'), NaN, Infinity, -Infinity],
	obj: {
		a: 1,
		b: false,
		e: '',
		f: -1.0,
		n: null,
		s: 'yes',
		//u: undefined,
		dummy: {},
		buf: Buffer.from('asdf'),
		arr: [-11, -2.0, -1, 0, 1, 2.0, 11, 'asdf', '', true, false, null, {x:42, o:{y:1}}, Buffer.from('asdf'), NaN, Infinity, -Infinity],
		nested: {
			a: 1,
			b: true,
			e: '',
			f: -1.0,
			n: null,
			s: 'hello',
			//u: undefined,
			dummy: {},
			buf: Buffer.from('asdf'),
			arr: [-11, -2.0, -1, 0, 1, 2.0, 11, 'asdf', '', true, false, null, {x:42, o:{y:1}}, Buffer.from('asdf'), NaN, Infinity, -Infinity],
		}
	}
}

module.exports = complexObj