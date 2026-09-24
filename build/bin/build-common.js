/**
 * common functions for build
 */

const { exec } = require('child_process')
const { resolve } = require('path')
const { writeFileSync, readFileSync } = require('fs')
const replace = require('replace-in-file')
const { rm, mv } = require('shelljs')

exports.run = function (cmd) {
  return new Promise((resolve, reject) => {
    console.log('Executing command:', cmd)
    const childProcess = exec(cmd, {
      env: {
        ...process.env,
        DEBUG: 'electron-builder:*',
        ELECTRON_BUILDER_CACHE: process.env.ELECTRON_BUILDER_CACHE || ''
      },
      maxBuffer: 1024 * 1024 * 50 // 50MB buffer for large debug output
    }, (err, stdout, stderr) => {
      // Always log stdout and stderr regardless of success/failure
      if (stdout) {
        console.log('=== STDOUT ===')
        console.log(stdout)
      }
      if (stderr) {
        console.log('=== STDERR ===')
        console.log(stderr)
      }

      if (err) {
        console.error('=== COMMAND FAILED ===')
        console.error('Command:', cmd)
        console.error('Exit code:', err.code)
        console.error('Signal:', err.signal)
        console.error('Error message:', err.message)

        // Create a more detailed error message
        const detailedError = new Error(`Command failed with exit code ${err.code}: ${cmd}`)
        detailedError.originalError = err
        detailedError.stdout = stdout
        detailedError.stderr = stderr
        detailedError.command = cmd
        return reject(detailedError)
      }

      resolve(stdout)
    })

    // Also pipe output in real-time for long-running commands
    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data)
    })

    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data)
    })
  })
}

/**
 * Remove a path, retrying on failure, then throwing.
 *
 * shelljs `rm` reports failures on stderr but still resolves, and on Windows a
 * freshly written file is frequently locked for a moment by the AV scanner or
 * the search indexer — so a single-pass delete over a few thousand files
 * reliably leaves stragglers behind (observed: 157 of 202 chunk files left
 * undeleted, with the build continuing regardless). A silent partial delete is
 * how a stale, untrimmed node_modules tree ends up inside the installer, so
 * this retries and then fails loudly instead of returning success.
 *
 * @param {string} target absolute or cwd-relative path to remove
 * @param {number} [attempts]
 */
exports.rmrfSync = function rmrfSync (target, attempts = 6) {
  const fs = require('fs')
  for (let i = 0; i < attempts; i++) {
    rm('-rf', target)
    if (!fs.existsSync(target)) {
      return
    }
    // synchronous backoff; a transient lock is usually gone within ~1s
    Atomics.wait(
      new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150 * (i + 1)
    )
  }
  throw new Error(
    `failed to remove ${target} after ${attempts} attempts; ` +
    'refusing to continue on a partially cleaned tree'
  )
}

exports.writeSrc = function (src) {
  const p = resolve(__dirname, '../../work/app/lib/install-src.js')
  writeFileSync(p, `module.exports = '${src}'`)
}

exports.builder = resolve(
  __dirname, '../../node_modules/.bin/electron-builder'
)

exports.reBuild = resolve(
  __dirname, '../../node_modules/.bin/electron-rebuild'
)

exports.replaceArr = function (froms, tos) {
  const pth = resolve(__dirname, '../../electron-builder.json')
  console.log('electron-builder', pth)
  let str = readFileSync(pth, 'utf8')
  for (let i = 0; i < froms.length; i++) {
    str = str.replace(froms[i], tos[i])
  }
  writeFileSync(pth, str)
}

exports.replaceJSON = function (func) {
  const pth = resolve(__dirname, '../../electron-builder.json')
  const js = require(pth)
  func(js)
  writeFileSync(pth, JSON.stringify(js, null, 2))
}

const options = {
  files: require('path').resolve(__dirname, '../../electron-builder.json'),
  from: ['"asar": true', '${productName}-${version}-${os}-${arch}.${ext}', ', "appx", "nsis"'], // eslint-disable-line
  to: ['"asar": false', '${productName}-${version}-${os}-${arch}-loose.${ext}', ''] // eslint-disable-line
}

exports.replaceRun = function () {
  return new Promise((resolve, reject) => {
    replace(options, (err) => {
      if (err) {
        return reject(err)
      }
      console.log('start build loose file(no asar)')
      resolve()
    })
  })
}

const shouldKeepFile = !!process.env.KEEP_FILE

exports.renameDist = function renameDist () {
  if (!shouldKeepFile) {
    return rm('-rf', 'dist')
  }
  mv('dist', 'dist' + new Date().getTime())
}

/**
 * Locate `app-builder-lib` (a dependency of electron-builder, not a direct one).
 *
 * Under a strict, non-flat node_modules (pnpm) a bare
 * `require.resolve('app-builder-lib/package.json')` from this file fails. Resolve
 * it as a sibling of electron-builder first, then fall back to a hoisted layout.
 *
 * @returns {string|null} absolute path to app-builder-lib/package.json
 */
function resolveAppBuilderLibPkg () {
  const path = require('path')
  const candidates = []
  try {
    candidates.push(path.join(
      path.dirname(require.resolve('electron-builder/package.json')),
      '..', 'app-builder-lib', 'package.json'
    ))
  } catch {}
  candidates.push('app-builder-lib/package.json')
  for (const c of candidates) {
    try {
      return require.resolve(c)
    } catch {}
  }
  return null
}

/**
 * Patch the electron-builder NSIS template so that the installer always tries
 * to keep shortcuts (desktop / start-menu / taskbar pins) when upgrading.
 *
 * By default, when `allowToChangeInstallationDirectory` is set, the template
 * sets `isTryToKeepShortcuts = "false"` for manual (non-auto-update) installs,
 * which causes `WinShell::UninstShortcut` / `UninstAppUserModelId` to be called
 * and the taskbar pin to be silently removed. Removing the guard makes the
 * installer always pass `--keep-shortcuts` to the old uninstaller when the
 * previous install wrote `KeepShortcuts = "true"` to the registry.
 *
 * Best effort: skipped with a log line when the template cannot be located,
 * so a packaging run never dies on this cosmetic patch.
 */
exports.patchNsisKeepShortcuts = function patchNsisKeepShortcuts () {
  const fs = require('fs')
  const path = require('path')
  const libPkg = resolveAppBuilderLibPkg()
  if (!libPkg) {
    console.log('NSIS keep-shortcuts patch: app-builder-lib not found, skipping')
    return
  }
  const templatePath = path.join(
    path.dirname(libPkg),
    'templates/nsis/include/installUtil.nsh'
  )
  if (!fs.existsSync(templatePath)) {
    console.log('NSIS keep-shortcuts patch: template not found, skipping')
    return
  }
  const original = fs.readFileSync(templatePath, 'utf-8')
  const patched = original.replace(
    /(!macro setIsTryToKeepShortcuts\s+StrCpy \$isTryToKeepShortcuts "true"\s*)!ifdef allowToChangeInstallationDirectory[\s\S]*?!endif(\s*!macroend)/,
    '$1$2'
  )
  if (patched === original) {
    console.log('NSIS keep-shortcuts patch: already applied or pattern not found, skipping')
  } else {
    fs.writeFileSync(templatePath, patched, 'utf-8')
    console.log('NSIS keep-shortcuts patch: applied successfully')
  }
}
