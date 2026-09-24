/**
 * Post-package assertions for the Windows x64 build.
 *
 * The installer is Windows x64 only, so the packaged app must not contain
 * native binaries for any other platform, Unix-only terminal code, or
 * third-party sourcemaps. A previous packaging run shipped 4.9 MB of
 * darwin/linux/android/arm64 prebuilds and a sourcemap set because the
 * trimming step silently skipped a package whose path could not be resolved —
 * nothing failed, so nothing was noticed. This script turns those invariants
 * into a hard, machine-checked gate.
 *
 * It also reports Authenticode signing status. Signing itself is driven by
 * electron-builder's own env vars (CSC_LINK / CSC_KEY_PASSWORD); this script
 * only fails when signing was clearly *intended* (those vars are set) but the
 * produced installer is not validly signed.
 *
 * Run after electron-builder:
 *   node build/bin/verify-package.js
 * Exits non-zero (and prints every violation) when an invariant is broken.
 */

const { readFileSync, readdirSync, existsSync, statSync } = require('fs')
const { resolve, join, basename } = require('path')

const root = resolve(__dirname, '../..')

/** Read the file table out of an asar archive (string-aware brace matching). */
function readAsarEntries (asarPath) {
  const buf = readFileSync(asarPath)
  let start = 0
  while (start < 64 && buf[start] !== 0x7b) {
    start++
  }
  if (start >= 64) {
    throw new Error(`${asarPath}: no asar JSON header found`)
  }
  let depth = 0
  let inStr = false
  let esc = false
  let end = -1
  for (let i = start; i < buf.length; i++) {
    const c = buf[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === 0x5c) esc = true
      else if (c === 0x22) inStr = false
      continue
    }
    if (c === 0x22) inStr = true
    else if (c === 0x7b) depth++
    else if (c === 0x7d) {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  if (end === -1) {
    throw new Error(`${asarPath}: unterminated asar JSON header`)
  }
  const header = JSON.parse(buf.subarray(start, end).toString('utf8'))
  const out = []
  const walk = (node, prefix) => {
    for (const [k, v] of Object.entries(node.files || {})) {
      const p = prefix + '/' + k
      if (v.files) walk(v, p)
      else out.push({ path: p, size: v.size || 0, unpacked: !!v.unpacked })
    }
  }
  walk(header, '')
  return out
}

/** Recursively list files under `dir`, following nothing (no symlink chase). */
function listFiles (dir, prefix = '') {
  const out = []
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const rel = prefix + '/' + e.name
    if (e.isSymbolicLink()) continue
    if (e.isDirectory()) out.push(...listFiles(join(dir, e.name), rel))
    else out.push({ path: rel, size: 0 })
  }
  return out
}

function findAsar () {
  const preferred = join(root, 'dist', 'win-unpacked', 'resources', 'app.asar')
  if (existsSync(preferred)) {
    return preferred
  }
  const distDir = join(root, 'dist')
  if (!existsSync(distDir)) {
    return null
  }
  for (const d of readdirSync(distDir)) {
    const p = join(distDir, d, 'resources', 'app.asar')
    if (existsSync(p)) {
      return p
    }
  }
  return null
}

/** True when the environment asks electron-builder to sign. */
function signingRequested () {
  return !!(
    process.env.CSC_LINK ||
    process.env.WIN_CSC_LINK ||
    process.env.CSC_KEY_PASSWORD ||
    process.env.WIN_CSC_KEY_PASSWORD
  )
}

/** Authenticode status of a file, or 'unknown' when it cannot be determined. */
function authenticodeStatus (file) {
  try {
    const { execFileSync } = require('child_process')
    const out = execFileSync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `(Get-AuthenticodeSignature -LiteralPath '${file.replace(/'/g, "''")}').Status`
    ], { encoding: 'utf8', timeout: 60000 })
    return out.trim() || 'unknown'
  } catch {
    return 'unknown'
  }
}

const asarPath = findAsar()
if (!asarPath) {
  console.error('verify-package: no packaged app.asar found under dist/')
  console.error('  run `pnpm run build-win` first')
  process.exit(1)
}

const entries = readAsarEntries(asarPath)
const unpackedDir = asarPath.replace(/app\.asar$/, 'app.asar.unpacked')
const unpackedEntries = existsSync(unpackedDir) ? listFiles(unpackedDir) : []

const violations = []
const note = (title, items) => {
  if (items.length) {
    violations.push({ title, items })
  }
}

// 1. Native prebuilds: only the win32-x64 slice may ship.
const foreignPrebuilds = []
for (const pkg of ['node-pty', '@serialport/bindings-cpp']) {
  const re = new RegExp(
    `/node_modules/${pkg.replace(/[/@+]/g, m => '\\' + m)}/prebuilds/([^/]+)/`
  )
  for (const e of entries) {
    const m = e.path.match(re)
    if (m && m[1] !== 'win32-x64') {
      foreignPrebuilds.push(`${m[1]}  ${e.path}`)
    }
  }
}
note('non-win32-x64 native prebuilds in app.asar', foreignPrebuilds)

// 2. The conpty copy shipped under third_party/ is per-arch too.
const foreignConpty = [
  ...entries.filter(e => /\/third_party\/conpty\/[^/]+\/win10-arm64\//.test(e.path)),
  ...unpackedEntries.filter(e => /\/third_party\/conpty\/[^/]+\/win10-arm64\//.test(e.path))
].map(e => e.path)
note('arm64 conpty under node-pty/third_party', foreignConpty)

// 3. Unix-only terminal implementation must not be in a Windows-only build.
const unixTerminal = [
  ...entries.filter(e => /node-pty\/lib\/unixTerminal\.js$/.test(e.path)),
  ...unpackedEntries.filter(e => /node-pty\/lib\/unixTerminal\.js$/.test(e.path))
].map(e => e.path)
note('Unix-only node-pty implementation', unixTerminal)

// 4. Sourcemaps are debug artifacts; they only bloat the installer and leak
//    the bundled sources.
const maps = entries.filter(e => e.path.endsWith('.map'))
if (maps.length) {
  const bytes = maps.reduce((s, e) => s + e.size, 0)
  violations.push({
    title: 'third-party sourcemaps',
    items: [`${maps.length} file(s), ${(bytes / 1048576).toFixed(2)} MB`,
      ...maps.sort((a, b) => b.size - a.size).slice(0, 5)
        .map(e => `${(e.size / 1024).toFixed(0)} KB  ${e.path}`)]
  })
}

// 5. Code signing status. Only a failure when signing was actually requested.
const distDir = join(root, 'dist')
const installer = existsSync(distDir)
  ? readdirSync(distDir).find(f => /installer\.exe$/i.test(f))
  : null
let signature = 'not checked'
if (installer) {
  signature = authenticodeStatus(join(distDir, installer))
  if (signature !== 'Valid' && signingRequested()) {
    violations.push({
      title: 'code signing was requested but the installer is not validly signed',
      items: [`Get-AuthenticodeSignature: ${signature}`, join(distDir, installer)]
    })
  }
}

// ---- report ---------------------------------------------------------------
const totalBytes = entries.reduce((s, e) => s + e.size, 0)
const mb = b => (b / 1048576).toFixed(2) + ' MB'
console.log(`verify-package: ${asarPath}`)
console.log(`  entries: ${entries.length} (${unpackedEntries.length} on-disk unpacked files)`)
console.log(`  total size: ${mb(totalBytes)}`)
console.log(`  app.asar: ${mb(statSync(asarPath).size)}`)
if (installer) {
  console.log(`  installer: ${basename(installer)}`)
  if (signature === 'Valid') {
    console.log('  signature: Valid')
  } else if (signature === 'unknown') {
    console.log('  signature: unknown (could not query Authenticode)')
  } else if (signingRequested()) {
    console.log(`  signature: ${signature}  <-- signing was requested`)
  } else {
    console.log(`  signature: ${signature}  <-- UNSIGNED; SmartScreen will warn.`)
    console.log('    to sign: set CSC_LINK and CSC_KEY_PASSWORD, then re-run build-win')
  }
}

if (violations.length === 0) {
  console.log('')
  console.log('OK: all packaging invariants hold (win32-x64 only, no sourcemaps)')
  process.exit(0)
}

console.error('')
console.error(`FAILED: ${violations.length} packaging invariant(s) violated`)
for (const v of violations) {
  console.error(`  - ${v.title}:`)
  for (const item of v.items) {
    console.error(`      ${item}`)
  }
}
console.error('')
console.error('Fix the trim step in build/bin/prepare.js, then re-run `pnpm run b`.')
console.error('A packaged app that is not rebuilt after a source change is also a failure —')
console.error('see the note in TRIM-NOTES.md about re-packaging after src/ edits.')
process.exit(1)
