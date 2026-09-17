/**
 * app entry
 */
const { app: electronApp } = require('electron')
const { packInfo } = require('./common/runtime-constants')

// Resolve the application name before anything touches a userData path.
// electron-log (required below) resolves the userData directory at import
// time, so setting the name here keeps the data directory in sync with
// package.json `name` instead of falling back to the display name.
// Guarded: with ELECTRON_RUN_AS_NODE=1 the process runs as plain node and
// `require('electron')` returns a path string instead of the app object.
if (electronApp && typeof electronApp.setName === 'function') {
  electronApp.setName(packInfo.name)
}

const log = require('./common/log')
const { createApp } = require('./lib/create-app')
const globalState = require('./lib/glob-state')

globalState.set('initTime', Date.now())

log.debug('vis remote tool start')

const app = createApp()
globalState.set('app', app)
