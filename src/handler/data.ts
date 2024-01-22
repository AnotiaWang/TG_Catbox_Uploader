import i18n from '../i18n/index.js'
import { bot } from '../../index.js'
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  rmSync,
} from 'fs'
import { DEFAULT_LANG, DEFAULT_SERVICE, DEFAULT_EXPR } from '../env.js'
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
  log(`Loaded data from ${Object.keys(chatData).length} chat(s)`)
}

export function cleanupOrphanTransferTasks() {
  let userCount = 0

  for (let chat in chatData) {
    if (chatData[chat].downloading) {
      userCount++
      chatData[chat].downloading = 0
      bot.sendMessage(chat, { message: i18n.t(chatData[chat].lang, 'error') }).catch()
    }
  }

  // Find cache files that were created before the bot was launched,
  // and delete them
  const now = new Date()
  const orphanFiles = readdirSync('./cache', 'utf-8').filter(filename => {
    const stat = statSync(`./cache/${filename}`)
    return stat.isFile() && stat.birthtime < now
  })
  orphanFiles.forEach(filename => {
    rmSync(`./cache/${filename}`)
  })

  log(`Aborted ${userCount} transfer(s) and deleted ${orphanFiles.length} orphan cache file(s)`)
}
