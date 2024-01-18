import * as fs from 'fs'
import strings from '../strings.js'
import mime from 'mime-types'
import bigInt from 'big-integer'
import { chatData, log } from './data.js'
import { bot, BOT_NAME } from '../../index.js'
import { Catbox, Litterbox } from 'node-catbox'
import {
  MAX_DOWNLOADING,
  ADMIN_ID,
  CATBOX_TOKEN,
  LOG_CHANNEL_ID,
  DOWNLOAD_DC_ID,
  DOWNLOAD_WORKERS,
} from '../env.js'
import type { Api } from 'telegram'

export async function transfer(msg: Api.Message) {
  if (msg.peerId.className !== 'PeerUser' || !msg.media) return

  const chat = msg.peerId.userId.toJSNumber()
  const lang = chatData[chat].lang

  if (chatData[chat].banned)
    return bot.sendMessage(chat, { message: strings[lang]['error_banned'] })
  else if (chatData[chat].downloading >= MAX_DOWNLOADING && chat !== ADMIN_ID)
    return bot.sendMessage(chat, {
      message: strings[lang]['flood_protection'].replace('{s}', MAX_DOWNLOADING),
    })

  let file: Api.TypeDocument | Api.TypePhoto | Api.TypeWebDocument
  if (
    'document' in msg.media &&
    msg.media.document &&
    msg.media.document.className === 'Document'
  ) {
    file = msg.media.document
  } else if ('photo' in msg.media && msg.media.photo && msg.media.photo.className === 'Photo') {
    file = msg.media.photo
  } else {
    return bot.sendMessage(chat, {
      message: strings[lang]['error_unsupportedFileType'],
      replyTo: msg.id,
    })
  }
  const service = chatData[chat].service
  let fileSize: number,
    fileExt: string,
    fileName = randomString(),
    filePath: string

  if (file.className === 'Photo') {
    const lastSize = file.sizes[file.sizes.length - 1]

    if ('sizes' in lastSize) fileSize = lastSize.sizes.slice(-1)[0]
    else if ('size' in lastSize) fileSize = lastSize.size
    else {
      return bot.sendMessage(chat, {
        message: strings[lang]['error_unsupportedFileType'],
        replyTo: msg.id,
      })
    }
    fileExt = 'jpg'
  } else {
    fileSize = file.size.toJSNumber()
    if (file.mimeType === 'application/x-tgsticker') {
      fileExt = 'tgs'
      await bot.sendMessage(chat, {
        message: strings[lang]['animatedStickers'],
        parseMode: 'html',
        linkPreview: false,
      })
    } else fileExt = mime.extension(file.mimeType) as string
  }

  if (
    (service === 'Catbox' && fileSize > 200000000) ||
    (service === 'Litterbox' && fileSize > 1000000000)
  )
    return bot.sendMessage(chat, {
      message: strings[lang]['err_FileTooBig'].replace('{s}', service),
    })

  chatData[chat].downloading++
  const editMsg = await bot.sendMessage(chat, {
    message: strings[lang]['downloading'],
    replyTo: msg.id,
  })

  if (!fs.existsSync('./cache')) fs.mkdirSync('./cache')

  while (fs.existsSync(`./cache/${chat}_${fileName}.${fileExt}`)) fileName = randomString()
  filePath = `./cache/${chat}_${fileName}.${fileExt}`
  log(`Start downloading: ${filePath} (Size ${fileSize})...`)

  try {
    // The last time when the message is edited, in UNIX timestamp format
    let lastEditTime = Date.now()
    let lastDownloadSize = 0
    let downloadedBytes = 0
    const chunkSize = 4096 * 1024 // 4 MB
    const totalChunks = Math.ceil(fileSize / chunkSize)
    let downloadedChunks = 0

    while (downloadedChunks < totalChunks) {
      if (!bot.connected) await bot.connect()

      let chunksToDownload = DOWNLOAD_WORKERS

      if (downloadedChunks + chunksToDownload > totalChunks) {
        chunksToDownload = totalChunks - downloadedChunks
      }
      // Download the file in chunks
      const chunks = await Promise.all(
        Array.from({ length: chunksToDownload }, (_, i) => {
          return bot
            .iterDownload({
              file: msg.media,
              requestSize: chunkSize,
              offset: bigInt(chunkSize * i + downloadedChunks * chunkSize),
              limit: 1,
              dcId: DOWNLOAD_DC_ID,
            })
            .collect()
        }),
      )
      // Append the chunks to the file
      chunks.forEach(chunk => {
        fs.appendFileSync(filePath, chunk[0] as Buffer, { encoding: 'binary' })
        downloadedBytes += (chunk[0] as Buffer).length
      })
      downloadedChunks += chunksToDownload

      const now = Date.now()
      // Update the progress message every 3 seconds
      if (downloadedBytes && now - lastEditTime > 3000) {
        // Convert to MB
        const downloaded = +(downloadedBytes / 1000 / 1000).toFixed(2)
        const total = +(fileSize / 1000 / 1000).toFixed(2)
        const speed = +((downloaded - lastDownloadSize) / ((now - lastEditTime) / 1000)).toFixed(2)
        const percent = Math.round((downloaded / total) * 100)
        const text =
          strings[lang]['downloadProgress']
            .replace('{1}', total.toString())
            .replace('{2}', downloaded.toString())
            .replace('{3}', speed.toString())
            .replace('{4}', secToTime(Math.round((total - downloaded) / speed))) +
          `\n\n<code>[${'●'.repeat(percent / 5.5)}${'○'.repeat(18 - percent / 5.5)}]</code>`
        lastEditTime = now
        lastDownloadSize = downloaded

        bot
          .editMessage(chat, {
            message: editMsg.id,
            text: text,
            parseMode: 'html',
          })
          .catch(() => {})
      }
    }

    log(`Downloaded: ${filePath} (Size ${fileSize})`)
    await bot
      .editMessage(chat, {
        message: editMsg.id,
        text: strings[lang]['uploading'].replace('{s}', service),
      })
      .catch(() => {})

    // Upload to Catbox / Litterbox
    let result: string

    if (service.toLowerCase() === 'catbox') {
      const client = new Catbox(chatData[chat].token || CATBOX_TOKEN || '')
      result = await client.uploadFile({ path: filePath })
    } else {
      const client = new Litterbox()
      result = await client.upload({
        path: filePath,
        duration: `${chatData[chat]['lbe']}h` as any,
      })
    }
    // If the result contains a link, which indicates upload was successful
    const validity = chatData[chat]['lbe']
    const hour = validity === 1 ? strings[lang]['hour'] : strings[lang]['hours']
    const text = strings[lang]['uploaded']
      .replace('{1}', service)
      .replace('{2}', (fileSize / 1000 / 1000).toFixed(2))
      .replace('{3}', service.toLowerCase() === 'catbox' ? '∞' : `${validity} ${hour}`)
      .replace('{4}', result)
      .replace('{5}', BOT_NAME)
    try {
      await bot.sendMessage(chat, {
        message: text,
        linkPreview: false,
        replyTo: msg.id,
        parseMode: 'html',
      })
    } catch (e) {
      // If send message fails, try to reconnect and send again
      try {
        await bot.sendMessage(chat, {
          message: text,
          parseMode: 'html',
          linkPreview: false,
        })
      } catch (e) {
        await bot
          .sendMessage(chat, { message: strings[lang]['error'] + `\n\nError info: ${e.message}` })
          .catch(() => null)
        log(`Download ${fileName} completed, but send message failed: ${e.message}`)
      }
    }
    chatData[chat].total++
    log(`Uploaded ${filePath} to ${service}`)
    if (LOG_CHANNEL_ID) {
      const logMsg = await bot
        .forwardMessages(LOG_CHANNEL_ID, {
          messages: msg.id,
          fromPeer: chat,
        })
        .catch(() => null)
      if (logMsg) {
        await bot.sendMessage(LOG_CHANNEL_ID, {
          message: `From: \`${chat}\`\nService: ${service}\nResult: \`${result}\``,
          replyTo: logMsg[0].id,
        })
      }
    }
  } catch (e) {
    await bot
      .sendMessage(chat, {
        message: strings[lang]['error'] + `\n\nError info: ${e.message}`,
        replyTo: msg.id,
      })
      .catch(() => {})
    log(`Download ${filePath} failed: ${e.stack}`)
  } finally {
    if (fs.existsSync(filePath)) fs.rmSync(filePath)
    chatData[chat].downloading--
    bot.deleteMessages(chat, [editMsg.id], { revoke: true }).catch(() => null)
    log(`Finished transferring process for ${filePath}`)
  }
}

// Generates a random string with length e
function randomString(e = 8) {
  const t = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678',
    a = t.length
  let n = ''
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a))
  return n
}

function secToTime(sec: number) {
  const hour = Math.floor(sec / 3600)
  const min = Math.floor((sec - hour * 3600) / 60)
  const secs = sec - hour * 3600 - min * 60

  return [
    hour.toString().padStart(2, '0'),
    min.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':')
}
