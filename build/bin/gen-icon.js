/**
 * Generate all application icons from the brand source image (iconrp.png
 * at the repository root).
 *
 * Pipeline:
 * 1. resize-icon.ps1 (System.Drawing) renders 256/128/64/48/32/16 px PNGs
 * 2. png-to-ico packs them into build-res/icon.ico (exe + NSIS installer)
 * 3. copies:
 *    - build-res/icon.png                       (electron-builder generic icon)
 *    - src/client/assets/brand/vis-round-128x128.png (runtime window icon
 *      + about-page small logo, see app/common/runtime-constants.js)
 *    - src/client/assets/brand/vis-tray.png     (system tray icon)
 */

const { execSync } = require('child_process')
const { resolve } = require('path')
const { copyFileSync, existsSync, writeFileSync } = require('fs')

const root = resolve(__dirname, '../..')
const source = resolve(root, 'iconrp.png')
const tmpDir = resolve(process.env.TEMP || '/tmp', 'vis-icon-build')

if (!existsSync(source)) {
  console.error(`icon source not found: ${source}`)
  process.exit(1)
}

console.log('resize source image...')
execSync(
  `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${resolve(__dirname, 'resize-icon.ps1')}"`,
  { stdio: 'inherit', cwd: root }
)

console.log('generate brand logo & watermark...')
execSync(
  `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${resolve(__dirname, 'make-brand.ps1')}"`,
  { stdio: 'inherit', cwd: root }
)

async function main () {
  const pngToIco = (await import('png-to-ico')).default
  const sizes = [256, 128, 64, 48, 32, 16]
  const pngs = sizes.map(s => resolve(tmpDir, `icon-${s}.png`))
  for (const p of pngs) {
    if (!existsSync(p)) {
      console.error(`missing resized png: ${p}`)
      process.exit(1)
    }
  }
  console.log('pack ico...')
  const icoBuf = await pngToIco(pngs)
  const icoOut = resolve(root, 'build-res/icon.ico')
  writeFileSync(icoOut, icoBuf)
  console.log('written', icoOut)

  copyFileSync(resolve(tmpDir, 'icon-256.png'), resolve(root, 'build-res/icon.png'))
  console.log('written', resolve(root, 'build-res/icon.png'))

  copyFileSync(resolve(tmpDir, 'icon-128.png'), resolve(root, 'src/client/assets/brand/vis-round-128x128.png'))
  console.log('written', resolve(root, 'src/client/assets/brand/vis-round-128x128.png'))

  copyFileSync(resolve(tmpDir, 'icon-32.png'), resolve(root, 'src/client/assets/brand/vis-tray.png'))
  console.log('written', resolve(root, 'src/client/assets/brand/vis-tray.png'))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
