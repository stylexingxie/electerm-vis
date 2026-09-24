/**
 * Password hashing for the local login gate.
 *
 * Deliberately dependency-free (no db, no electron): `lib/auth.js` pulls in
 * `lib/db`, which opens a database at require time, so keeping the hashing
 * separate is what makes it unit-testable.
 */

const crypto = require('crypto')
const { secureEqual } = require('../common/secure-compare')

// OWASP's current recommendation for PBKDF2-HMAC-SHA512.
const DEFAULT_ITERATIONS = 210000
// What the app used before the iteration count was stored. Records written by
// older builds carry no `iterations` field and must keep verifying.
const LEGACY_ITERATIONS = 1000

/**
 * Derive a new password digest.
 *
 * `hashedPassword` deliberately stays a bare hex digest: it doubles as the
 * `/auth` token (server/server.js compares it against `process.env.requireAuth`,
 * which server/child-process.js fills from `userConfig.hashedPassword`). The
 * iteration count therefore lives in its own field rather than being encoded
 * into the digest string.
 *
 * @param {string} password
 * @param {number} [iterations]
 * @returns {{salt: string, hashedPassword: string, iterations: number}}
 */
function hashPassword (password, iterations = DEFAULT_ITERATIONS) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hashedPassword = crypto.pbkdf2Sync(
    password, salt, iterations, 64, 'sha512'
  ).toString('hex')
  return { salt, hashedPassword, iterations }
}

/**
 * Verify a password against a stored digest.
 *
 * Records with no (or invalid) `iterations` fall back to LEGACY_ITERATIONS, so
 * passwords stored by earlier builds keep working.
 *
 * @param {string} password
 * @param {string} salt
 * @param {string} hashedPassword
 * @param {number} [iterations] iteration count the digest was produced with
 * @returns {boolean}
 */
function comparePasswords (password, salt, hashedPassword, iterations) {
  if (typeof salt !== 'string' || typeof hashedPassword !== 'string') {
    return false
  }
  const stored = Number(iterations)
  const rounds = Number.isFinite(stored) && stored > 0
    ? stored
    : LEGACY_ITERATIONS
  const hash = crypto.pbkdf2Sync(
    password, salt, rounds, 64, 'sha512'
  ).toString('hex')
  return secureEqual(hash, hashedPassword)
}

exports.hashPassword = hashPassword
exports.comparePasswords = comparePasswords
exports.DEFAULT_ITERATIONS = DEFAULT_ITERATIONS
exports.LEGACY_ITERATIONS = LEGACY_ITERATIONS
