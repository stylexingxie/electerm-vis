const { _electron: electron } = require('@playwright/test')
const {
  test: it
} = require('@playwright/test')
const { describe } = it
it.setTimeout(120000)
const delay = require('./common/wait')
const log = require('./common/log')
const appOptions = require('./common/app-options')
const extendClient = require('./common/client-extend')

describe('theme switch via real UI clicks', function () {
  it('apply default light then apply default through list buttons', async function () {
    const electronApp = await electron.launch(appOptions)
    const client = await electronApp.firstWindow()
    extendClient(client, electronApp)
    await delay(3500)

    await client.click('.btns .anticon-picture')
    await delay(800)

    const applyByTitle = async (title) => {
      const r = await client.evaluate((t) => {
        const rows = [...document.querySelectorAll('.setting-wrap .item-list-unit.theme-item')]
        const row = rows.find(x => x.textContent.trim() === t)
        if (!row) return 'row not found: ' + t
        const icon = row.querySelector('.list-item-apply')
        if (!icon) return 'no apply icon on: ' + t
        icon.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        return 'icon clicked: ' + t
      }, title)
      log(r)
      await delay(600)
      const r2 = await client.evaluate(() => {
        const btns = [...document.querySelectorAll('.ant-tooltip:not(.ant-tooltip-hidden) button')]
        const applyBtn = btns.find(b =>
          b.textContent.includes('应用') ||
          b.textContent.includes('Apply') ||
          b.textContent.toLowerCase().includes('apply')
        )
        if (!applyBtn) return 'no apply button in tooltip'
        applyBtn.click()
        return 'apply clicked'
      }, )
      log(r2)
      await delay(800)
      return client.evaluate(() => window.store.config.theme)
    }

    log('apply default light')
    const t1 = await applyByTitle('default light')
    console.log('config.theme after default light:', t1)
    console.log('ui main:', await client.evaluate(() => window.store.getUiThemeConfig().main))

    log('apply 默认 (back to default)')
    const t2 = await applyByTitle('默认')
    console.log('config.theme after default:', t2)
    console.log('ui main:', await client.evaluate(() => window.store.getUiThemeConfig().main))

    await electronApp.close().catch(console.log)
  })
})
