const { userConfigId } = require('../common/constants')
const { dbAction } = require('./db')
const getPort = require('./get-port')
const {
  hashPassword,
  comparePasswords
} = require('./password-hash')

exports.setPassword = async function setPassword (password) {
  const q = {
    _id: userConfigId
  }
  const userConfig = await dbAction('data', 'findOne', q) || {}
  if (password === '') {
    await dbAction('data', 'update', q, {
      ...q,
      ...userConfig,
      salt: '',
      hashedPassword: '',
      iterations: 0
    }, {
      upsert: true
    })
    return true
  }
  const { salt, hashedPassword, iterations } = hashPassword(password)
  await dbAction('data', 'update', q, {
    ...q,
    ...userConfig,
    salt,
    hashedPassword,
    iterations
  }, {
    upsert: true
  })
  return true
}

exports.checkPassword = async function checkPassword (password) {
  const axios = require('axios')
  axios.defaults.proxy = false
  if (!password) {
    return false
  }
  const q = {
    _id: userConfigId
  }
  const {
    salt,
    hashedPassword,
    iterations
  } = await dbAction('data', 'findOne', q) || {}
  const r = comparePasswords(password, salt, hashedPassword, iterations)
  if (r) {
    // No transparent re-hash to DEFAULT_ITERATIONS here, deliberately: the
    // server child process receives `hashedPassword` as `requireAuth` in its
    // environment when it is spawned (server/child-process.js) and compares
    // that snapshot against the token posted below. Rotating the stored digest
    // mid-session would leave the snapshot stale and break the /auth handshake.
    // Records written by older builds therefore keep verifying at
    // LEGACY_ITERATIONS until the password is set again — at which point
    // setPassword() re-hashes it with DEFAULT_ITERATIONS.
    const port = await getPort()
    await axios.post(`http://127.0.0.1:${port}/auth`, {
      token: hashedPassword
    })
  }
  return r
}
