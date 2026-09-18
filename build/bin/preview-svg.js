// debug helper: render brand SVGs on the morph-shape blue blob and screenshot
const { chromium } = require('@playwright/test')
const { resolve } = require('path')
const fs = require('fs')

async function main () {
  const root = resolve(__dirname, '../..')
  const outDir = resolve(process.env.TEMP || '/tmp', 'vis-svg-preview')
  fs.mkdirSync(outDir, { recursive: true })
  const svg = fs.readFileSync(resolve(root, 'src/client/assets/brand/vis-chimp.svg'), 'utf8')
  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 900, height: 320 } })
  const html = `
    <body style="margin:0;display:flex;gap:24px;align-items:center;justify-content:center;height:100vh;
      background:linear-gradient(90deg,#1a1a1e 0%,#3a3a42 50%,#f2f2f5 100%);">
      <style>.blob{background:linear-gradient(45deg,#08c 0%,#09c 100%);
        border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;padding:20px;display:inline-block;}</style>
      <div class="blob">${svg.replace('width="128" height="128"', 'width="180" height="180"')}</div>
      <div>${svg.replace('width="128" height="128"', 'width="180" height="180"')}</div>
      <div style="background:#08c;padding:8px;border-radius:16px;">${svg.replace('width="128" height="128"', 'width="80" height="80"')}</div>
      <div style="background:#0a78c8;padding:4px;border-radius:12px;">${svg.replace('width="128" height="128"', 'width="40" height="40"')}</div>
    </body>`
  await page.setContent(html)
  await page.screenshot({ path: resolve(outDir, 'chimp-preview.png') })
  await browser.close()
  console.log('saved', resolve(outDir, 'chimp-preview.png'))
}

main().catch(e => { console.error(e); process.exit(1) })
