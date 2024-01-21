import i18n from '../i18n/index.js'
import { Button } from 'telegram/tl/custom/button.js'
import { chatData } from './data.js'
import type { Api } from 'telegram'
import type { StorageService } from '../types/data.js'

// Shorthand for the buttons
function cb(text: string, data: string) {
  return Button.inline(text, Buffer.from(data))
}

// Select a storage service (Catbox / Litterbox)
const setService = (chat: string | number) => {
  const t = (current: StorageService) => (chatData[chat].service === current ? ' ✅' : '')
  return [
    [
      cb(`Catbox${t('Catbox')}`, 'setService_Catbox'),
      cb(`Litterbox${t('Litterbox')}`, 'setService_Litterbox'),
    ],
    back(chatData[chat].lang)[0],
  ]
}

// The main menu of settings
const mainSettings = (chat: string | number) => {
  const lang = chatData[chat].lang
  const hour = chatData[chat]['lbe'] === 1 ? i18n.t(lang, 'hour') : i18n.t(lang, 'hours')

  return [
    [cb(i18n.t(lang, 'settings_setLang') + ` (${i18n.t(lang, 'name')})`, 'setLang')],
    [cb(i18n.t(lang, 'settings_setService') + ` (${chatData[chat]['service']})`, 'setService')],
    [cb(i18n.t(lang, 'settings_setExpr') + ` (${chatData[chat]['lbe']} ${hour})`, 'setLBE')],
    [cb(i18n.t(lang, 'token'), 'setToken')],
  ]
}

// Set the language of the bot
const setLanguage = (lang: string) => {
  const buttons: Api.KeyboardButtonCallback[][] = []
  let tmp: Api.KeyboardButtonCallback[] = []

  for (const _lang of i18n.languages) {
    tmp.push(cb(i18n.t(_lang, 'name') + (_lang === lang ? ' ✅' : ''), `setLang_${_lang}`))
    if (tmp.length === 2) {
      buttons.push(tmp)
      tmp = []
    }
  }
  if (tmp.length > 0) buttons.push(tmp)
  buttons.push(back(lang)[0])
  return buttons
}

const setLitterBoxExpiration = (lang: string, chat: string | number) => {
  const hour = i18n.t(lang, 'hour')
  const hours = i18n.t(lang, 'hours')
  const tick = (current: number) => (chatData[chat]['lbe'] === current ? ' ✅' : '')

  return [
    [cb(`1 ${hour}${tick(1)}`, 'setLBE_1'), cb(`12 ${hours}${tick(12)}`, 'setLBE_12')],
    [cb(`24 ${hours}${tick(24)}`, 'setLBE_24'), cb(`72 ${hours}${tick(72)}`, 'setLBE_72')],
    back(lang)[0],
  ]
}

// Set the token of Catbox
const setToken = (chat: string | number) => {
  const lang = chatData[chat]['lang']
  const bt = [back(lang)[0]]

  if (chatData[chat]['token']) bt.unshift([cb(i18n.t(lang, 'unbindToken'), 'setToken_unbind')])
  return bt
}

// Back button
const back = (lang: string) => {
  return [[cb(i18n.t(lang, 'settings_back'), 'back')]]
}

export { setLanguage, mainSettings, setService, setLitterBoxExpiration, back, setToken }
