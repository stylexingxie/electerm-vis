const { resolve } = require('path')
const { cp, mkdir } = require('shelljs')
// brand assets (app logo / watermark / tray icon) live in the repo
const brandFrom = resolve(
  __dirname,
  '../../src/client/assets/brand/*'
)
const from0 = resolve(
  __dirname,
  '../../node_modules/electerm-icons/icons'
)
const to1 = resolve(
  __dirname,
  '../../work/app/assets/images/'
)
const to2 = resolve(
  __dirname,
  '../../work/app/assets/icons'
)
const arr = [
  {
    from: brandFrom,
    to: to1,
    file: true
  }, {
    from: from0,
    to: to2
  }
]

mkdir('-p', to1)
mkdir('-p', to2)

for (const obj of arr) {
  const {
    file, from, to
  } = obj
  if (file) {
    cp(from, to)
  } else {
    cp('-r', from, to)
  }
}
