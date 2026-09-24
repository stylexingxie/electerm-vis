/**
 * communication between webview and app
 * run functions in seprate process, avoid using electron.remote directly
 */

const fs = require('./fs')
const log = require('../common/log')
const fetch = require('./fetch')
const {
  createTerm,
  testTerm,
  resize,
  runCmd,
  execCmd,
  toggleTerminalLog,
  toggleTerminalLogTimestamp,
  setTerminalLogPath,
  startTerminalLogFile
} = require('./terminal-api')
const globalState = require('./global-state')
const wsDec = require('./ws-dec')
const { secureEqual } = require('../common/secure-compare')

const { tokenElecterm } = process.env

function verify (req) {
  const { token: to } = req.query
  // Constant-time compare: tokenElecterm is a per-startup random value, so the
  // practical exposure is minimal, but a byte-wise early exit is free to avoid.
  if (!secureEqual(to, tokenElecterm)) {
    throw new Error('not valid request')
  }
  // process.env.requireAuth holds the hashed login password (see
  // lib/child-process.js): when a password is configured, WS channels
  // additionally require the /auth-verified state. An empty value means
  // no password is configured and the token check above is enough.
  if (process.env.requireAuth && !globalState.authed) {
    throw new Error('auth required')
  }
}

const initWs = function (app) {
  // common functions
  app.ws('/common/s', (ws, req) => {
    verify(req)
    wsDec(ws)
    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message)
        const { action } = msg
        if (action === 'fetch') {
          fetch(ws, msg)
        } else if (action === 'fs') {
          fs(ws, msg)
        } else if (action === 'create-terminal') {
          createTerm(ws, msg)
        } else if (action === 'test-terminal') {
          testTerm(ws, msg)
        } else if (action === 'resize-terminal') {
          resize(ws, msg)
        } else if (action === 'toggle-terminal-log') {
          toggleTerminalLog(ws, msg)
        } else if (action === 'toggle-terminal-log-timestamp') {
          toggleTerminalLogTimestamp(ws, msg)
        } else if (action === 'set-terminal-log-path') {
          setTerminalLogPath(ws, msg)
        } else if (action === 'start-terminal-log-file') {
          startTerminalLogFile(ws, msg)
        } else if (action === 'run-cmd') {
          runCmd(ws, msg)
        } else if (action === 'exec-cmd') {
          execCmd(ws, msg)
        }
      } catch (err) {
        log.error('common ws error', err)
      }
    })
  })
  // end
}

exports.verifyWs = verify
exports.initWs = initWs
