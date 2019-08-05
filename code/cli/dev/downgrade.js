const MetaFile = require('../../core/update/sync-dir/meta-file.js')
const targetDir = require('./make-change.js')

let meta = new MetaFile(targetDir)
meta.rehash()
meta.summary.version = '0.0.1'
meta.save()

require('../restart.js')