/**
 * multi language support
 */

const { defaultLang } = require('../common/runtime-constants')
const { resolve } = require('path')

function getOsLocale () {
  return require('os-locale-s')
    .osLocale()
    .catch(() => '')
}

async function loadLocales () {
  const sysLocale = await getOsLocale() || defaultLang
  // locales are vendored into the repo (src/app/vendor/electerm-locales) so the
  // packaged app needs no extra dependency resolution for language packs
  const localeFolder = resolve(__dirname, '../vendor/electerm-locales/dist/cjs')
  // languages array
  const langs = require(resolve(localeFolder, 'list.json'))
    .map(fileName => {
      const filePath = resolve(localeFolder, fileName)
      const lang = require(filePath)
      return {
        path: filePath,
        id: fileName.replace('.js', ''),
        name: lang.name,
        reg: lang.match,
        lang: lang.lang
      }
    })
  const langMap = langs.reduce((prev, l) => {
    prev[l.id] = l
    return prev
  }, {})
  return {
    langs,
    langMap,
    sysLocale
  }
}

function findLang (langs, la) {
  let res = false
  for (const l of langs) {
    res = new RegExp(l.reg).test(la)
    if (res) {
      res = l.id
      break
    }
  }
  return res
}

const getLang = (config, sysLocale, langs) => {
  if (config.language) {
    return config.language
  }
  // internal build: Simplified Chinese is the default UI language,
  // regardless of the OS locale (config.language, set in the settings
  // panel, always wins)
  return findLang(langs, 'zh_cn') || defaultLang
}

exports.getLang = getLang
exports.loadLocales = loadLocales
