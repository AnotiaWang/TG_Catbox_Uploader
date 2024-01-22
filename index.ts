import { TelegramClient, type Api } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { LogLevel } from 'telegram/extensions/Logger.js'
import { CallbackQuery } from 'telegram/events/CallbackQuery.js'
import { NewMessage } from 'telegram/events/index.js'
import { loadBotData, log, cleanupOrphanTransferTasks } from './src/handler/data.js'
import { API_ID, API_HASH, BOT_TOKEN } from './src/env.js'
import { handleCallbackQuery } from './src/handler/callbackQuery.js'
import { handleMessage } from './src/handler/message.js'

const stringSession = new StringSession(
  existsSync('./data/.session') ? readFileSync('./data/.session', 'utf-8') : '',
)

log('Login to Telegram...')

export const bot = new TelegramClient(stringSession, API_ID, API_HASH, {
  connectionRetries: 5,
  useWSS: false,
  autoReconnect: true,
})

loadBotData()
bot.setLogLevel(LogLevel.INFO)
bot.addEventHandler(handleMessage, new NewMessage({}))
bot.addEventHandler(handleCallbackQuery, new CallbackQuery())
await bot.start({
  botAuthToken: BOT_TOKEN,
})
await bot.connect()

cleanupOrphanTransferTasks()

export const BOT_NAME = ((await bot.getMe()) as Api.User).username!

writeFileSync('./data/.session', bot.session.save() as unknown as string)
log('Launched successfully.')

process
  .on('unhandledRejection', (reason, promise) => {
    console.error(reason, 'Unhandled Rejection at', promise)
  })
  .on('uncaughtException', error => {
    console.error(error, 'Uncaught Exception thrown')
  })
