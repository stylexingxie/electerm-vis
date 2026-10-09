/**
 * post install script
 */
const { cp, exec, rm } = require('shelljs')
const { existsSync } = require('fs')
const { resolve, dirname } = require('path')
const prePushPath = resolve(__dirname, '../../.git/hooks/pre-push')
const prePushPathFrom = resolve(__dirname, 'pre-push')

// NOTE: this project is built fully offline for internal distribution, so the
// script must not reach the network. The upstream version cleared the npm
// cache and (re)installed node-gyp globally when running on Windows CI —
// both were removed on purpose.

// Remove optional native module that may fail to rebuild
try {
  // Check multiple potential locations for cpu-features
  const cpuFeaturesPaths = [
    resolve(__dirname, '../../node_modules/cpu-features'),
    resolve(__dirname, '../../work/app/node_modules/cpu-features')
  ]

  cpuFeaturesPaths.forEach(cpuFeaturesPath => {
    if (existsSync(cpuFeaturesPath)) {
      rm('-rf', cpuFeaturesPath)
      console.log('Removed optional module:', cpuFeaturesPath)
    }
  })
} catch (e) {
  console.warn('Failed to remove cpu-features:', e?.message || e)
}

// Rebuild native modules (node-pty, @serialport/bindings-cpp) against the
// bundled Electron. `electron-rebuild` is not a declared dependency, so this
// is a best-effort step: it is skipped (instead of silently failing) when the
// binary is missing, which is the normal case for a plain `pnpm install`.
const rebuildBin = resolve(__dirname, '../../node_modules/.bin/electron-rebuild')
if (existsSync(rebuildBin)) {
  exec(`"${rebuildBin}"`)
} else {
  console.log('electron-rebuild not installed, skipping native module rebuild')
}

// Install the pre-push hook when this is a git checkout. Guarded because a
// plain source archive has no .git directory at all (shelljs cp would throw).
try {
  if (existsSync(dirname(prePushPath)) && !existsSync(prePushPath)) {
    cp(prePushPathFrom, prePushPath)
  }
} catch (e) {
  console.warn('Failed to install pre-push hook:', e?.message || e)
}
