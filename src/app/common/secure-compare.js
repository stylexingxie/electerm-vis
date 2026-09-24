/**
 * Constant-time string comparison.
 *
 * Lives in `common/` and stays dependency-free on purpose: it is required both
 * by the main process (lib/auth.js) and by the server child process
 * (server/server.js, server/dispatch-center.js), which cannot pull in main
 * process modules such as lib/db.
 *
 * Why this exists: the loopback token and hashed-password checks used plain
 * `===`, which short-circuits on the first differing byte. Anyone able to
 * measure the response time of the local `/auth` endpoint or of a WebSocket
 * handshake could in principle recover the secret byte by byte. The secrets are
 * per-startup random (WS token) or a 128-hex-character PBKDF2 digest, and the
 * listener is bound to 127.0.0.1, so the practical risk is small — but the fix
 * costs nothing.
 */

const crypto = require('crypto')

/**
 * Compare two values as strings without leaking their contents through timing.
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean} true when both are equal strings
 */
exports.secureEqual = function secureEqual (a, b) {
  const ba = Buffer.from(typeof a === 'string' ? a : '')
  const bb = Buffer.from(typeof b === 'string' ? b : '')
  if (ba.length !== bb.length) {
    // timingSafeEqual throws on a length mismatch. Compare bb against itself
    // first so the amount of work does not depend on how the lengths differ,
    // then report failure.
    crypto.timingSafeEqual(bb, bb)
    return false
  }
  return crypto.timingSafeEqual(ba, bb)
}
