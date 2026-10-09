const { rmrfSync } = require('./build-common')

const targets = [
  'work'
]

for (const t of targets) {
  // Retrying matters: shelljs `rm` resolves even when it failed to delete
  // things, and this script used to ignore the result entirely. A partially
  // removed work/ is worse than no clean at all — `prepare.js` then installs
  // into the leftovers, so the packaged app silently mixes old and new files.
  // That is one of the ways a stale, untrimmed node_modules tree reaches the
  // installer.
  rmrfSync(t)
  console.log(`clean: removed ${t}/`)
}
