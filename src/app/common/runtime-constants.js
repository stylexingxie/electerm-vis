/**
 * run time contants
 */

const os = require('os')
const { resolve } = require('path')

const platform = os.platform()
const arch = os.arch()
const isWin = platform === 'win32'
const isMac = platform === 'darwin'
const isLinux = platform === 'linux'
const isArm = arch.includes('arm')

const { NODE_ENV, NODE_TEST } = process.env
const isDev = NODE_ENV === 'development'
const iconPath = resolve(
  __dirname,
  (
    isDev
      ? '../../../src/client/assets/brand/vis-round-128x128.png'
      : '../assets/images/vis-round-128x128.png'
  )
)
const trayIconPath = resolve(
  __dirname,
  (
    isDev
      ? '../../../src/client/assets/brand/vis-tray.png'
      : '../assets/images/vis-tray.png'
  )
)
const extIconPath = isDev
  ? '/node_modules/electerm-icons/icons/'
  : 'icons/'

const defaultUserName = require('./default-user-name')
const packInfo = require(isDev ? '../../../package.json' : '../package.json')

// Folder this app uses under the OS app-data directory (databases, per-user
// data, local-storage keys). Derived from the package name so a renamed build
// never reads or writes another application's data — it used to be hard-coded
// to 'electerm', which made this build open the upstream app's database.
const dataFolderName = packInfo.name

module.exports = {
  isTest: !!NODE_TEST,
  isDev,
  isWin,
  isMac,
  isArm,
  isLinux,
  iconPath,
  trayIconPath,
  extIconPath,
  defaultUserName,
  dataFolderName,
  minWindowWidth: 590,
  minWindowHeight: 400,
  defaultLang: 'zh_cn',
  tempDir: require('os').tmpdir(),
  homeOrTmp: os.homedir() || os.tmpdir(),
  packInfo
}
