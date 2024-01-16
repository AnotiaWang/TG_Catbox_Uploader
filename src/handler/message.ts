import { chatData, handleCommand, initChatData, transfer } from './index.js'
import { bot } from '../../index.js'
import strings from '../strings.js'
import type { NewMessageEvent } from 'telegram/events'

// Message handler
export async function handleMessage(event: NewMessageEvent) {
  const msg = event.message
  // Currently, only support private messages
  if (msg.peerId.className !== 'PeerUser') return
  const chatId = msg.peerId.userId.toString()
  const lang = chatData[chatId].lang
  
  // Check if the user has configured the bot
  initChatData(chatId)
  if (isCommand(msg.message)) await handleCommand(msg)
  else if (msg.media) await transfer(msg)
  else {
    bot
      .sendMessage(chatId, {
        message: strings[lang]['sendMeAFile'],
      })
      .catch(() => null)
  }
}

function isCommand(message: string) {
  return message.startsWith('/')
}
