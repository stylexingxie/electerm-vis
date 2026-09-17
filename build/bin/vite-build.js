/**
 * build the renderer bundle with vite.
 *
 * vite is invoked directly (instead of nesting a package-manager call such as
 * `npm run build` / `pnpm run build`) so the build works no matter how the
 * package manager is installed or whether it is resolvable from a nested shell.
 * The exit code is propagated so CI fails loudly.
 */
const { exec, cd } = require('shelljs')
const { resolve } = require('path')
const p = resolve(__dirname, '../vite')
cd(p)

process.env.NODE_ENV = 'production'
const viteBin = resolve(__dirname, '../../node_modules/vite/bin/vite.js')
const code = exec(`node "${viteBin}" build --config ./conf.js`).code
process.exit(code)
