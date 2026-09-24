const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('crypto')

const {
  hashPassword,
  comparePasswords,
  DEFAULT_ITERATIONS,
  LEGACY_ITERATIONS
} = require('../../../src/app/lib/password-hash')
const { secureEqual } = require('../../../src/app/common/secure-compare')

// Reproduce what a pre-upgrade build wrote: PBKDF2 at LEGACY_ITERATIONS with no
// `iterations` field on the record.
function makeLegacyRecord (password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hashedPassword = crypto.pbkdf2Sync(
    password, salt, LEGACY_ITERATIONS, 64, 'sha512'
  ).toString('hex')
  return { salt, hashedPassword }
}

describe('secureEqual', () => {
  it('accepts equal strings', () => {
    assert.strictEqual(secureEqual('abc', 'abc'), true)
    assert.strictEqual(secureEqual('', ''), true)
    assert.strictEqual(secureEqual('a'.repeat(128), 'a'.repeat(128)), true)
  })

  it('rejects equal-length but different strings', () => {
    assert.strictEqual(secureEqual('abc', 'abd'), false)
    assert.strictEqual(secureEqual('a'.repeat(127) + 'b', 'a'.repeat(128)), false)
  })

  it('rejects different lengths', () => {
    assert.strictEqual(secureEqual('abc', 'abcd'), false)
    assert.strictEqual(secureEqual('abc', ''), false)
  })

  it('does not throw on non-string input', () => {
    assert.strictEqual(secureEqual(undefined, 'abc'), false)
    assert.strictEqual(secureEqual('abc', undefined), false)
    assert.strictEqual(secureEqual(123, '123'), false)
    // non-strings normalise to '', mirroring the old `===` behaviour for ''
    assert.strictEqual(secureEqual(null, ''), true)
  })
})

describe('password hashing', () => {
  it('verifies a freshly hashed password', () => {
    const { salt, hashedPassword, iterations } = hashPassword('hunter2')
    assert.strictEqual(iterations, DEFAULT_ITERATIONS)
    assert.strictEqual(typeof salt, 'string')
    assert.strictEqual(salt.length, 32)
    assert.strictEqual(hashedPassword.length, 128)
    assert.strictEqual(
      comparePasswords('hunter2', salt, hashedPassword, iterations), true
    )
  })

  it('rejects a wrong password', () => {
    const { salt, hashedPassword, iterations } = hashPassword('hunter2')
    assert.strictEqual(
      comparePasswords('hunter3', salt, hashedPassword, iterations), false
    )
    assert.strictEqual(
      comparePasswords('', salt, hashedPassword, iterations), false
    )
  })

  it('uses a fresh salt and produces a different digest each time', () => {
    const a = hashPassword('same-password')
    const b = hashPassword('same-password')
    assert.notStrictEqual(a.salt, b.salt)
    assert.notStrictEqual(a.hashedPassword, b.hashedPassword)
  })

  it('uses a stronger iteration count than the legacy default', () => {
    assert.ok(DEFAULT_ITERATIONS >= 210000)
    assert.ok(DEFAULT_ITERATIONS > LEGACY_ITERATIONS)
  })

  it('still verifies a legacy record that has no iterations field', () => {
    const { salt, hashedPassword } = makeLegacyRecord('oldpass')
    // undefined / 0 / null all mean "written before iterations was stored"
    assert.strictEqual(comparePasswords('oldpass', salt, hashedPassword, undefined), true)
    assert.strictEqual(comparePasswords('oldpass', salt, hashedPassword, 0), true)
    assert.strictEqual(comparePasswords('oldpass', salt, hashedPassword, null), true)
    assert.strictEqual(comparePasswords('wrong', salt, hashedPassword, undefined), false)
  })

  it('does not accept a legacy digest when given the new iteration count', () => {
    const { salt, hashedPassword } = makeLegacyRecord('oldpass')
    assert.strictEqual(
      comparePasswords('oldpass', salt, hashedPassword, DEFAULT_ITERATIONS), false
    )
  })

  it('verifies a record stored with an explicit iteration count', () => {
    const { salt, hashedPassword, iterations } = hashPassword('explicit', 50000)
    assert.strictEqual(iterations, 50000)
    assert.strictEqual(comparePasswords('explicit', salt, hashedPassword, 50000), true)
    assert.strictEqual(comparePasswords('explicit', salt, hashedPassword, 1000), false)
  })

  it('rejects malformed or cleared records instead of throwing', () => {
    // the "no password configured" state stores empty strings
    assert.strictEqual(comparePasswords('anything', '', '', 0), false)
    assert.strictEqual(comparePasswords('anything', undefined, undefined, undefined), false)
    assert.strictEqual(comparePasswords('anything', null, null, undefined), false)
    assert.strictEqual(comparePasswords('anything', 'salt', undefined, 1000), false)
    assert.strictEqual(comparePasswords('anything', undefined, 'hash', 1000), false)
  })
})
