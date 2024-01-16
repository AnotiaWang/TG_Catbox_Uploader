import strings from '../strings.js'
import { chatData, ADMIN_ID, buttons, saveBotData } from './index.js'
import { bot, BOT_NAME } from '../../index.js'
import { Catbox } from 'node-catbox'
import type { Api } from 'telegram'

// Bot command handler
export async function handleCommand(msg: Api.Message) {
  const text = msg.message,
    chat = (msg.peerId as Api.PeerUser).userId.toJSNumber()
  let command = text.split(' ')[0].substring(1)
  const mention = command.split('@')[1]
  // If the text contains mention, need to check if the mentioned target is the bot
  if (mention && mention !== BOT_NAME) return
  // Split the text into command and arguments
  command = command.split('@')[0]
  const arg = text.split(' ').slice(1).join(' ')
  // Check if the command is valid
  if (GeneralCommands.prototype.hasOwnProperty(command)) new GeneralCommands(msg)[command](arg)
  else if (OwnerCommands.prototype.hasOwnProperty(command) && chat.toString() === ADMIN_ID)
    new OwnerCommands(msg)[command](arg)
}

class OwnerCommands {
  chat: number
  lang: string

  constructor(msg: Api.Message) {
    this.chat = (msg.peerId as Api.PeerUser).userId.toJSNumber()
    this.lang = chatData[this.chat].lang
  }

  ban(arg: string) {
    if (arg) {
      const user = parseInt(arg)
      if (chatData[user]) {
        chatData[user].banned = true
        saveBotData()
        bot.sendMessage(this.chat, { message: strings[this.lang]['banned'] }).catch(console.error)
      } else {
        bot
          .sendMessage(this.chat, { message: strings[this.lang]['userNotFound'] })
          .catch(console.error)
      }
    } else {
      bot.sendMessage(this.chat, { message: 'Usage: /ban UID' }).catch(console.error)
    }
  }

  unban(arg: string) {
    if (arg) {
      const user = parseInt(arg)
      if (chatData[user]) {
        chatData[user].banned = false
        saveBotData()
        bot.sendMessage(this.chat, { message: strings[this.lang]['unbanned'] }).catch(console.error)
      } else {
        bot
          .sendMessage(this.chat, { message: strings[this.lang]['userNotFound'] })
          .catch(console.error)
      }
    } else {
      bot.sendMessage(this.chat, { message: 'Usage: /unban UID' }).catch(console.error)
    }
  }

  async broadcast(text: string) {
    if (!text) return bot.sendMessage(ADMIN_ID, { message: 'Come on, say something.' })
    const chats = Object.keys(chatData)
    const count = chats.length
    const result = await bot.sendMessage(ADMIN_ID, {
      message: `Start broadcasting tp ${count} chats...`,
    })
    let edit = setInterval(() => {
      bot
        .editMessage(ADMIN_ID, {
          message: result.id,
          text: `Broadcasting, remaining ${chats.length} / ${count}...`,
        })
        .catch(() => null)
    }, 2000)
    while (chats.length) {
      const chat = chats.shift()!
      await bot.sendMessage(chat, { message: text }).catch(e => {
        if (e.message.toLowerCase().includes('flood')) chats.push(chat)
      })
      await sleep(100)
    }
    clearInterval(edit)
    await bot.editMessage(ADMIN_ID, { message: result.id, text: 'Broadcast success!' })
  }
}

class GeneralCommands {
  chat: number
  lang: string

  constructor(msg: Api.Message) {
    this.chat = (msg.peerId as Api.PeerUser).userId.toJSNumber()
    this.lang = chatData[this.chat].lang
  }

  start() {
    bot
      .sendMessage(this.chat, {
        // Initial message does not support i18n
        message:
          '🐱 <b>欢迎！请在下方选择您的语言。发送 /help 命令查看帮助。\n\nWelcome! Please select a language below. Send /help to see what I can do.</b>',
        parseMode: 'html',
        buttons: buttons.setLanguage(this.lang),
      })
      .catch(console.error)
  }

  help() {
    bot
      .sendMessage(this.chat, {
        message: strings[this.lang]['help'],
        parseMode: 'html',
        linkPreview: false,
      })
      .catch(console.error)
  }

  settings() {
    bot
      .sendMessage(this.chat, {
        message: strings[this.lang]['settings'],
        parseMode: 'html',
        buttons: buttons.mainSettings(this.chat),
      })
      .catch(console.error)
  }

  async stats() {
    let total = 0,
      downloading = 0
    for (let chat in chatData) {
      downloading += chatData[chat].downloading
      total += chatData[chat].total
    }
    await bot.sendMessage(this.chat, {
      message: strings[this.lang]['stats']
        .replace('{1}', Object.keys(chatData).length)
        .replace('{2}', downloading)
        .replace('{3}', total)
        .replace('{4}', chatData[this.chat].total),
      parseMode: 'html',
    })
  }

  async delete(link: string) {
    if (link) {
      // Parse the filename if it's a link
      if (link.startsWith('http')) {
        link = new URL(link).pathname.substring(1)
      }
      if (chatData[this.chat].token) {
        let result = ''
        const catbox = new Catbox(chatData[this.chat].token)

        try {
          await catbox.deleteFiles({ files: [link] })
          await bot.sendMessage(this.chat, { message: strings[this.lang]['deleteFileSuccess'] })
        } catch (e) {
          console.error(`Delete file ${link} failed:`, e)
          if (e.message.includes("doesn't exist")) {
            result = strings[this.lang]['operationFailed'].replace(
              '{s}',
              strings[this.lang]['fileNotFound'],
            )
          } else if (e.message.includes("didn't belong to")) {
            result = strings[this.lang]['operationFailed'].replace(
              '{s}',
              strings[this.lang]['fileWrongOwnership'],
            )
          } else result = strings[this.lang]['unknownError']
          await bot.sendMessage(this.chat, { message: result })
        }
      } else
        await bot.sendMessage(this.chat, {
          message: strings[this.lang]['err_TokenNeeded'],
          parseMode: 'html',
          linkPreview: false,
        })
    } else
      await bot.sendMessage(this.chat, {
        message: strings[this.lang]['help_delete'],
        parseMode: 'html',
      })
  }

  async token(token: string) {
    if (token) {
      chatData[this.chat].token = token
      await bot.sendMessage(this.chat, { message: strings[this.lang]['setSuccess'] })
    } else {
      await bot.sendMessage(this.chat, {
        message: strings[this.lang]['help_token'].replace('{t}', chatData[this.chat].token || '🚫'),
        parseMode: 'html',
        linkPreview: false,
      })
    }
  }
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
