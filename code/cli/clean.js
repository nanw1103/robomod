#!/bin/env node
require('./util/init.js')
const fse = require('fs-extra')
const path = require('path')
const RBM_DIR = path.join(__dirname, '../../')
fse.removeSync(path.join(__dirname, 'log'))
fse.emptyDirSync(path.join(RBM_DIR, 'log'))
fse.emptyDirSync(path.join(RBM_DIR, 'data'))
fse.emptyDirSync(path.join(RBM_DIR, 'update'))

const defaultConfig = path.join(RBM_DIR, 'config.default')
const targetConfig = path.join(RBM_DIR, 'config.js')
fse.copySync(defaultConfig, targetConfig, {
	preserveTimestamps: true
})
