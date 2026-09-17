/**
 * build: bundle the renderer, copy static assets, render index.html
 *
 * Every step is invoked directly through the current node binary instead of a
 * package manager (`npm run x`) or a bare `node`, so the build works no matter
 * what is on PATH — and so a failing step actually fails the build.
 */

const { exec, echo } = require('shelljs')
const { resolve } = require('path')

const node = process.execPath
const bin = (file) => resolve(__dirname, file)

function runStep (label, file) {
  echo(label)
  const code = exec(`"${node}" "${bin(file)}"`).code
  if (code !== 0) {
    echo(`${label} failed (exit ${code})`)
    process.exit(code)
  }
}

echo('start build')

const timeStart = +new Date()

runStep('js/css file', 'vite-build.js')
runStep('copy file', 'copy.js')
runStep('html file', 'pug.js')

const endTime = +new Date()
echo(`done build in ${(endTime - timeStart) / 1000} s`)
