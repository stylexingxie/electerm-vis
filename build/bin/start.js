/**
 * start the vite dev server (and let the caller launch electron against it).
 *
 * The dev server is invoked directly instead of nesting a package-manager call
 * (`npm start` / `pnpm start`), for the same reason as vite-build.js.
 */
const { exec, cd } = require('shelljs')
const { resolve } = require('path')
const p = resolve(__dirname, '../vite')
cd(p)

const code = exec('node ./dev-server.js').code
process.exit(code)
