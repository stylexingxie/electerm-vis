const delay = require('./wait')
const { expect } = require('./expect')

// Two platform gotchas this helper used to trip over:
//  1. select-all was sent as `Meta+A` (Cmd). The terminal's own select-all
//     binding (`terminal_selectAll`) is commented out in
//     shortcuts-defaults.js, so no key combo selects the terminal buffer —
//     `store.selectall()` is the real entry point (same one the app uses).
//  2. copy/paste need Cmd on macOS but Ctrl elsewhere.
const modKey = process.platform === 'darwin' ? 'Meta' : 'Control'

async function selectAll (client) {
  await client.evaluate(() => window.store.selectall())
  await delay(401)
}

async function copy (client) {
  await selectAll(client)
  await client.keyboard.press(`${modKey}+C`)
  await delay(401)
}

exports.basicTerminalTest = async (client, cmd) => {
  async function focus () {
    client.click('.session-current .term-wrap')
  }
  await copy(client)
  const text1 = await client.readClipboard()
  await delay(301)
  await focus()
  await delay(1010)
  await client.keyboard.type(cmd)
  await client.keyboard.press('Enter')
  await delay(1011)
  await copy(client)
  await delay(101)
  const text2 = await client.readClipboard()
  expect(text1.trim().length).lessThan(text2.trim().length)
}

exports.getTerminalContent = async function (client) {
  await client.click('.session-current .term-wrap')
  await delay(300)
  await selectAll(client)
  await client.keyboard.press(`${modKey}+C`)
  await delay(300)
  const clipboardText = await client.readClipboard()
  await client.keyboard.press('Escape')
  await delay(300)
  return clipboardText
}
