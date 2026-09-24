const express = require('express')
const globalState = require('./global-state')
const app = express()
const log = require('../common/log')
const { initWs } = require('./dispatch-center')
const {
  isDev
} = require('../common/runtime-constants')
const initFileServer = require('../lib/file-server')
const appDec = require('./app-wrap')
const { secureEqual } = require('../common/secure-compare')

appDec(app)

app.get('/run', function (req, res) {
  res.send('ok')
})
app.post('/auth', function (req, res) {
  const { token } = req.body
  // Constant-time compare: the token is the PBKDF2 digest of the login
  // password, so a byte-wise early exit would leak it under timing analysis.
  if (secureEqual(token, process.env.requireAuth)) {
    globalState.authed = true
  }
  res.send('ok')
})
if (!isDev) {
  initFileServer(app)
}
initWs(app)

const runServer = function () {
  const { electermPort, electermHost } = process.env
  app.listen(electermPort, electermHost, () => {
    log.info('server', 'runs on', electermHost, electermPort)
    process.send({ serverInited: true })
  })
}

// start
runServer()

process.on('uncaughtException', (err) => {
  log.error('uncaughtException', err)
})
process.on('unhandledRejection', (err) => {
  log.error('unhandledRejection', err)
})

process.on('SIGTERM', () => {
  process.exit(0)
})
