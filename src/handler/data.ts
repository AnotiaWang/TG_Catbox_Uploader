import strings from '../strings.js'
import { bot } from '../../index.js'
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'fs'
import { DEFAULT_LANG, DEFAULT_SERVICE, DEFAULT_EXPR, BOT_TOKEN, API_ID, API_HASH } from '../env.js'
import type { UserData } from '../types/data.js'

export let chatData: Record<string, UserData> = {}
export const chatDataTemplate = {
  lang: DEFAULT_LANG,
  downloading: 0,
  total: 0,
  service: DEFAULT_SERVICE,
  lbe: DEFAULT_EXPR,
  banned: false,
  token: '',
}

// console.log, with date added
export function log(...text: any[]) {
  console.log(`[${new Date().toISOString()}] [Bot] - ${text.join(' ')}`)
}

export function initChatData(userId: string | number | bigint) {
  const _userId = userId.toString()
  if (!chatData[_userId]) {
    chatData[_userId] = Object.assign({}, chatDataTemplate)
    console.log(`User ${_userId} data initialized`)
  } else {
    for (let key in chatDataTemplate) {
      if (!chatData[_userId][key]) {
        chatData[_userId][key] = chatDataTemplate[key]
      }
    }
  }
  saveBotData()
}

export function saveBotData() {
  writeFileSync('./data/chatsList.json', JSON.stringify(chatData))
}

export function loadBotData() {
  log('Loading bot data...')
  if (!existsSync('./data')) mkdirSync('./data')
  if (existsSync('./data/chatsList.json'))
    chatData = JSON.parse(readFileSync('./data/chatsList.json', 'utf-8')) || {}
  for (let chat in chatData) {
    if (chatData[chat].downloading) {
      chatData[chat].downloading = 0
      bot.sendMessage(chat, { message: strings[chatData[chat].lang]['error'] }).catch()
    }
  }
  let i18n = readdirSync('./src/i18n')
  log(`Loaded data from ${Object.keys(chatData).length} chat(s)`)
  log(`Loaded ${i18n.length} language(s) (found ${i18n.join(', ')})`)
}

export function launchBot() {
  log('Launching...')
  if (BOT_TOKEN && API_ID && API_HASH) log('Login to Telegram...')
  else {
    console.error('Please set BOT_TOKEN, API_ID and API_HASH in .env file')
    process.exit(1)
  }
}
