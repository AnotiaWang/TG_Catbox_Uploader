import strings from '../strings.js'
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
  const hour = chatData[chat]['lbe'] === 1 ? strings[lang]['hour'] : strings[lang]['hours']

  return [
    [cb(strings[lang]['settings_setLang'] + ` (${strings[lang]['name']})`, 'setLang')],
    [cb(strings[lang]['settings_setService'] + ` (${chatData[chat]['service']})`, 'setService')],
    [cb(strings[lang]['settings_setExpr'] + ` (${chatData[chat]['lbe']} ${hour})`, 'setLBE')],
    [cb(strings[lang]['token'], 'setToken')],
  ]
}

// Set the language of the bot
const setLanguage = (lang: string) => {
  const buttons: Api.KeyboardButtonCallback[][] = []
  let tmp: Api.KeyboardButtonCallback[] = []

  for (let i18n in strings) {
    tmp.push(cb(strings[i18n]['name'] + (lang === i18n ? ' ✅' : ''), `setLang_${i18n}`))
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
  const hour = strings[lang]['hour']
  const hours = strings[lang]['hours']
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

  if (chatData[chat]['token']) bt.unshift([cb(strings[lang]['unbindToken'], 'setToken_unbind')])
  return bt
}

// Back button
const back = (lang: string) => {
  return [[cb(strings[lang]['settings_back'], 'back')]]
}

export { setLanguage, mainSettings, setService, setLitterBoxExpiration, back, setToken }
