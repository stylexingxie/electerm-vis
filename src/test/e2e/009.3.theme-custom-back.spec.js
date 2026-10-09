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

describe('custom theme then back to default', function () {
  it('create + apply custom theme, then apply default via UI', async function () {
    const electronApp = await electron.launch(appOptions)
    const client = await electronApp.firstWindow()
    extendClient(client, electronApp)
    await delay(3500)

    await client.click('.btns .anticon-picture')
    await delay(800)

    // iterm themes uiThemeConfig integrity (renderTag destructures it)
    const itermInfo = await client.evaluate(() => {
      const arr = window.store.itermThemes || []
      return {
        count: arr.length,
        missingUiThemeConfig: arr.filter(d => !d.uiThemeConfig).length,
        first: arr[0] ? Object.keys(arr[0]) : []
      }
    })
    console.log('iterm themes:', JSON.stringify(itermInfo))

    // build a custom theme using the same shape the form produces
    await client.evaluate(() => {
      const theme = {
        id: 'testCustomTheme1',
        name: '测试主题A',
        themeConfig: {
          background: '#002b36',
          foreground: '#eee8d5',
          cursor: '#eee8d5',
          selectionBackground: 'rgba(200,200,200,0.6)',
          cursorAccent: '#002b36',
          black: '#073642',
          red: '#dc322f',
          green: '#859900',
          yellow: '#b58900',
          blue: '#268bd2',
          magenta: '#d33682',
          cyan: '#2aa198',
          white: '#eee8d5',
          brightBlack: '#002b36',
          brightRed: '#cb4b16',
          brightGreen: '#586e75',
          brightYellow: '#657b83',
          brightBlue: '#839496',
          brightMagenta: '#6c71c4',
          brightCyan: '#93a1a1',
          brightWhite: '#fdf6e3'
        },
        uiThemeConfig: {
          main: '#073642',
          'main-dark': '#002b36',
          'main-light': '#586e75',
          text: '#eee8d5',
          'text-light': '#fdf6e3',
          'text-dark': '#93a1a1',
          'text-disabled': '#657b83',
          primary: '#268bd2',
          info: '#b58900',
          success: '#859900',
          error: '#dc322f',
          warn: '#cb4b16'
        }
      }
      window.store.addTheme(theme)
    })
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
          b.textContent.toLowerCase().includes('apply')
        )
        if (!applyBtn) return 'no apply button in tooltip'
        applyBtn.click()
        return 'apply clicked'
      })
      log(r2)
      await delay(800)
      return client.evaluate(() => ({
        configTheme: window.store.config.theme,
        uiMain: window.store.getUiThemeConfig().main,
        termBg: window.store.getThemeConfig().background
      }))
    }

    log('apply custom theme')
    const s1 = await applyByTitle('测试主题A')
    console.log('after custom:', JSON.stringify(s1))

    log('apply 默认 (back to default)')
    const s2 = await applyByTitle('默认')
    console.log('after default:', JSON.stringify(s2))
    console.log('PASS back-to-default:', s2.configTheme === 'default' && s2.uiMain === '#121214')

    await electronApp.close().catch(console.log)
  })
})
