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

// electron-builder needs a flat, real-file node_modules for the packaged app:
// pnpm's default symlinked layout hides every package behind
// node_modules/.pnpm, which breaks `files` / `asarUnpack` glob matching (most
// visibly the node-pty native binding). `node-linker=hoisted` produces an
// npm-style tree for work/app only — the repository keeps pnpm's default.
require('fs').writeFileSync(
  resolve(__dirname, '../../work/app/.npmrc'),
  'node-linker=hoisted\n'
)

// Install production dependencies only.
//
// The package manager is taken from `npm_execpath`, which the invoking package
// manager (pnpm / npm / yarn) exports for lifecycle scripts, and is run through
// the current node binary. This avoids depending on the manager being
// resolvable on the child process PATH — a nested bare `pnpm` call fails
// whenever the manager is not installed globally.
const packageManager = process.env.npm_execpath
  ? `"${process.execPath}" "${process.env.npm_execpath}"`
  : 'pnpm'
exec(`${packageManager} install --prod`, {
  cwd: resolve(__dirname, '../../work/app')
})
// the packaged app does not need the packaging-only .npmrc
rm('-rf', 'work/app/.npmrc')
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

// Windows-only build: drop the prebuilt native binaries for other platforms.
// node-pty and @serialport/bindings-cpp ship node-gyp-build style prebuilds for
// every platform/arch, and only the win32-x64 one can ever be loaded here.
if (isWin) {
  const fs = require('fs')
  for (const pkg of ['node-pty', '@serialport/bindings-cpp']) {
    const prebuilds = resolve(
      __dirname, '../../work/app/node_modules', pkg, 'prebuilds'
    )
    if (!fs.existsSync(prebuilds)) {
      continue
    }
    for (const entry of fs.readdirSync(prebuilds)) {
      if (entry !== 'win32-x64') {
        rm('-rf', `${prebuilds}/${entry}`)
      }
    }
  }
}

// Remove all test files from node-pty to reduce bundle size
rm('-rf', 'work/app/node_modules/node-pty/lib/*.test.js')
rm('-rf', 'work/app/node_modules/node-pty/lib/*.test.js.map')
rm('-rf', 'work/app/node_modules/node-pty/lib/testUtils.test.js')
rm('-rf', 'work/app/node_modules/node-pty/lib/testUtils.test.js.map')

// drop lockfiles generated inside the packaged app; the electron-builder
// bundle does not need them
rm('-rf', 'work/app/package-lock.json')
rm('-rf', 'work/app/pnpm-lock.yaml')
rm('-rf', 'work/app/yarn.lock')
require('./clean-empty-folders').main()

const endTime = +new Date()
echo(`done pack prepare in ${(endTime - timeStart) / 1000} s`)
