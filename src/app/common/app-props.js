/**
 * app path
 */
const { app } = require('electron')
const { resolve, dirname, basename } = require('path')
const constants = require('./runtime-constants')
const installSrc = require('../lib/install-src')

function getDataPath () {
  const defaultValue = {
    appPath: app.getPath('appData'),
    isPortable: false
  }
  if (!constants.isWin) {
    return defaultValue
  }
  // Resolve the portable-mode layout without hard-coding the executable or
  // folder name, so the build keeps working after the product was renamed:
  // portable builds ship as <install dir>/<app name>/<exe>.
  const exeFullPath = app.getPath('exe')
  const exePath = dirname(exeFullPath)
  const p = resolve(exePath, constants.packInfo.name)
  if (
    installSrc === 'win-x64-portable.tar.gz' ||
    require('fs').existsSync(
      p
    )
  ) {
    return {
      appPath: exePath,
      exePath,
      isPortable: true
    }
  }
  return {
    ...defaultValue,
    exePath
  }
}

module.exports = {
  ...getDataPath(),
  exeName: basename(app.getPath('exe')),
  sshKeysPath: resolve(
    app.getPath('home'),
    '.ssh'
  ),
  ...constants
}
