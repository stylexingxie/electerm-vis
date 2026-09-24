/**
 * prepare the files to be packed
 */

const pack = require('../../package.json')
const os = require('os')
const { resolve } = require('path')
const { version } = pack
const { mkdir, rm, exec, echo, cp } = require('shelljs')
const dir = 'dist/v' + version

const platform = os.platform()
const isWin = platform === 'win32'

pack.main = 'app.js'
delete pack.scripts
delete pack.standard
delete pack.files
delete pack.engines
delete pack.preferGlobal

if (isWin) {
  delete pack.dependencies['node-bash']
} else {
  delete pack.dependencies['node-powershell']
}

echo('start pack prepare')
const timeStart = +new Date()
rm('-rf', dir)
rm('-rf', 'dist/latest')

mkdir('-p', dir)
mkdir('-p', 'dist/latest')
cp('-r', 'src/app', 'work/')
rm('-rf', 'work/app/user-config.json')
rm('-rf', 'work/app/localstorage.json')
rm('-rf', 'work/app/nohup.out')
rm('-rf', 'work/app/assets/js/index*')
rm('-rf', 'work/app/assets/js/*.txt')
rm('-rf', 'node_modules/cpu-features')

require('fs').writeFileSync(
  resolve(__dirname, '../../work/app/package.json'),
  JSON.stringify(
    pack, null, 2
  )
)

// Without this file pnpm walks up and adopts the repository root as its
// workspace: it reuses the root lockfile and runs the root project's
// lifecycle scripts (whose devDependencies are absent under --prod).
// A local pnpm-workspace.yaml makes work/app its own standalone root.
//
// It carries the two settings this packaging step depends on:
//   - `nodeLinker: hoisted` — electron-builder needs a flat, real-file
//     node_modules for the packaged app; pnpm's default symlinked layout hides
//     every package behind node_modules/.pnpm, which breaks `files` /
//     `asarUnpack` glob matching (most visibly the node-pty native binding).
//   - `allowBuilds` — the install scripts of the native/optional modules must be
//     allowed to run in the packaged tree. The list has to be COMPLETE: a
//     package with an install script that is left out fails the whole install
//     with ERR_PNPM_IGNORED_BUILDS. `electron-winstaller` is easy to miss — it
//     comes in transitively via electron-builder-squirrel-windows and lives
//     under node_modules/.pnpm, so a top-level existence check cannot see it.
//
// Both MUST live here rather than in an .npmrc: since pnpm 11 an .npmrc is only
// read for auth/registry settings, so the `node-linker=hoisted` line this script
// used to write was silently ignored — which is exactly why work/app kept coming
// out as a symlinked tree no matter what the .npmrc said.
require('fs').writeFileSync(
  resolve(__dirname, '../../work/app/pnpm-workspace.yaml'),
  [
    'nodeLinker: hoisted',
    'allowBuilds:',
    "  '@serialport/bindings-cpp': true",
    '  electron: true',
    '  electron-winstaller: true',
    '  node-pty: true',
    ''
  ].join('\n')
)

// Install production dependencies only.
//
// The package manager is taken from `npm_execpath`, which the invoking package
// manager (pnpm / npm / yarn) exports for lifecycle scripts, and is run through
// the current node binary. This avoids depending on the manager being
// resolvable on the child process PATH — a nested bare `pnpm` call fails
// whenever the manager is not installed globally.
// A standalone pnpm install exposes npm_execpath as a self-contained
// `pnpm.exe`, which node cannot execute — run it directly in that case.
// Otherwise npm_execpath is a JS entry (pnpm.cjs / npm-cli.js / yarn.js)
// and must be run through the current node binary.
const isExecutablePath = /\.exe$/i.test(process.env.npm_execpath || '')
const packageManager = process.env.npm_execpath
  ? (isExecutablePath
      ? `"${process.env.npm_execpath}"`
      : `"${process.execPath}" "${process.env.npm_execpath}"`)
  : 'pnpm'
exec(`${packageManager} install --prod`, {
  cwd: resolve(__dirname, '../../work/app')
})
// the packaged app does not need the packaging-only .npmrc / workspace file
rm('-rf', 'work/app/.npmrc')
rm('-rf', 'work/app/pnpm-workspace.yaml')
rm('-rf', 'work/app/node_modules/.bin')
// Remove axios browser/ESM builds and unnecessary files (keep only lib/ and node CJS)
rm('-rf', 'work/app/node_modules/axios/dist/esm')
rm('-rf', 'work/app/node_modules/axios/dist/browser')
rm('-rf', 'work/app/node_modules/axios/dist/*.js')
rm('-rf', 'work/app/node_modules/axios/dist/*.map')
rm('-rf', 'work/app/node_modules/axios/dist/node/*.map')
rm('-rf', 'work/app/node_modules/axios/index.d.cts')
rm('-rf', 'work/app/node_modules/axios/lib')

// Remove cpu-features after install to prevent rebuild issues
rm('-rf', 'node_modules/cpu-features')
rm('-rf', 'work/app/node_modules/cpu-features')

// Clean up node-pty platform-specific files to reduce bundle size
if (isWin) {
  // On Windows, remove Unix-specific files
  rm('-rf', 'work/app/node_modules/node-pty/lib/unixTerminal.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/unixTerminal.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/lib/unixTerminal.test.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/unixTerminal.test.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/build/pty.target.mk')
  rm('-rf', 'work/app/node_modules/node-pty/build/spawn-helper.target.mk')
  rm('-rf', 'work/app/node_modules/node-pty/build/binding.Makefile')
  rm('-rf', 'work/app/node_modules/node-pty/build/gyp-mac-tool')
} else {
  // On Linux/Mac, remove Windows-specific files
  rm('-rf', 'work/app/node_modules/node-pty/lib/conpty_console_list_agent.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/conpty_console_list_agent.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsConoutConnection.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsConoutConnection.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsPtyAgent.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsPtyAgent.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsPtyAgent.test.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsPtyAgent.test.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsTerminal.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsTerminal.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsTerminal.test.js')
  rm('-rf', 'work/app/node_modules/node-pty/lib/windowsTerminal.test.js.map')
  rm('-rf', 'work/app/node_modules/node-pty/deps/winpty')
}

const fs = require('fs')
const path = require('path')

/**
 * Locate a package's real directory inside work/app/node_modules.
 *
 * Under pnpm's default (symlinked) layout a transitive dependency such as
 * @serialport/bindings-cpp does not exist at node_modules/<pkg> at all — it
 * only lives at node_modules/.pnpm/<parent>@<version>/node_modules/<pkg>.
 * Resolving just the top-level path made the trim below skip the entire
 * package, which is how 4.9 MB of foreign-platform binaries reached the
 * installer. Try the direct path first (hoisted layout), then the store.
 */
const locatePackage = (name) => {
  const modulesRoot = resolve(__dirname, '../../work/app/node_modules')
  const direct = path.join(modulesRoot, ...name.split('/'))
  if (fs.existsSync(direct)) {
    return direct
  }
  const store = path.join(modulesRoot, '.pnpm')
  if (!fs.existsSync(store)) {
    return null
  }
  for (const entry of fs.readdirSync(store)) {
    const candidate = path.join(store, entry, 'node_modules', ...name.split('/'))
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/** Remove every entry of `dir` except `keep`; returns how many were removed. */
const keepOnly = (dir, keep) => {
  if (!fs.existsSync(dir)) {
    return 0
  }
  let removed = 0
  for (const entry of fs.readdirSync(dir)) {
    if (entry === keep) {
      continue
    }
    const target = path.join(dir, entry)
    rm('-rf', target)
    // shelljs `rm` does not throw on failure. Verifying here matters: an
    // unnoticed failed deletion is exactly how non-Windows prebuilds survive
    // the trim and ship inside the installer.
    if (fs.existsSync(target)) {
      throw new Error(`prepare: failed to remove ${target}`)
    }
    removed++
  }
  return removed
}

// Windows-only build: drop the prebuilt native binaries for other platforms.
// node-pty and @serialport/bindings-cpp ship node-gyp-build style prebuilds for
// every platform/arch, and only the win32-x64 one can ever be loaded here.
if (isWin) {
  for (const pkg of ['node-pty', '@serialport/bindings-cpp']) {
    const pkgDir = locatePackage(pkg)
    if (!pkgDir) {
      // Fail loudly. A silent skip here is precisely what let the
      // non-Windows prebuilds ship inside the installer.
      throw new Error(
        `prepare: cannot locate ${pkg} under work/app/node_modules; ` +
        'the non-win32-x64 prebuild trim cannot be applied'
      )
    }
    const removed = keepOnly(path.join(pkgDir, 'prebuilds'), 'win32-x64')
    echo(`trim ${pkg}/prebuilds: removed ${removed} non-win32-x64 dir(s)`)
  }

  // node-pty additionally ships a conpty build per arch under third_party/,
  // which the prebuilds trim never touched (win10-arm64 was ~1.2 MB of dead
  // weight on a Windows x64-only product).
  const ptyDir = locatePackage('node-pty')
  const conptyRoot = path.join(ptyDir, 'third_party', 'conpty')
  if (fs.existsSync(conptyRoot)) {
    for (const ver of fs.readdirSync(conptyRoot)) {
      const removed = keepOnly(path.join(conptyRoot, ver), 'win10-x64')
      echo(`trim node-pty/third_party/conpty/${ver}: removed ${removed} dir(s)`)
    }
  }
}

// Remove all test files from node-pty to reduce bundle size
rm('-rf', 'work/app/node_modules/node-pty/lib/*.test.js')
rm('-rf', 'work/app/node_modules/node-pty/lib/*.test.js.map')
rm('-rf', 'work/app/node_modules/node-pty/lib/testUtils.test.js')
rm('-rf', 'work/app/node_modules/node-pty/lib/testUtils.test.js.map')

// Drop third-party sourcemaps. They are pure debug artifacts in a shipped
// app: ~6.5 MB across ~570 files, and they expose the bundled sources. The
// renderer bundle is built without sourcemaps (vite default), so nothing in
// the package can consume them. Symlinks are skipped so the pnpm store is
// walked once, through .pnpm, rather than re-visited per top-level link.
{
  let maps = 0
  const walk = (dir) => {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.isSymbolicLink()) {
        continue
      }
      const p = path.join(dir, e.name)
      if (e.isDirectory()) {
        walk(p)
      } else if (e.name.endsWith('.map')) {
        fs.rmSync(p, { force: true })
        maps++
      }
    }
  }
  walk(resolve(__dirname, '../../work/app/node_modules'))
  echo(`removed ${maps} sourcemap file(s)`)
}

// drop lockfiles generated inside the packaged app; the electron-builder
// bundle does not need them
rm('-rf', 'work/app/package-lock.json')
rm('-rf', 'work/app/pnpm-lock.yaml')
rm('-rf', 'work/app/yarn.lock')
require('./clean-empty-folders').main()

const endTime = +new Date()
echo(`done pack prepare in ${(endTime - timeStart) / 1000} s`)
