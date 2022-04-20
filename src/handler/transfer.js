import CatBox from "catbox.moe";
import { MAX_DOWNLOADING, chatData, LOG_CHANNEL_ID, CATBOX_TOKEN } from "./index.js";
import strings from "../strings.js";
import * as fs from "fs";
import { bot, BOT_NAME } from "../../index.js";
import mime from 'mime-types';
import { log } from "./data.js";

export async function transfer(msg) {
    const chat = parseInt(msg.peerId.userId.value);
    const lang = chatData[chat].lang;

    if (chatData[chat].banned)
        return bot.sendMessage(chat, { message: strings[lang]["error_banned"] });
    else if (chatData[chat].downloading >= MAX_DOWNLOADING)
        return bot.sendMessage(chat, { message: strings[lang]["flood_protection"].replace('{s}', MAX_DOWNLOADING) });

    const Catbox = new CatBox.Catbox(chatData[chat].token || CATBOX_TOKEN || '');
    const Litterbox = new CatBox.Litterbox();
    const file = msg.media.document || msg.media.photo;
    const service = chatData[chat].service;
    let fileSize, fileExt, fileName = randomString(), filePath, editMsg;

    if (typeof file.className !== 'undefined' && file.className === 'Photo') {
        fileSize = file.sizes[file.sizes.length - 1].sizes.pop();
        fileExt = 'jpg';
    } else {
        fileSize = file.size;
        if (file.mimeType === 'application/x-tgsticker') {
            fileExt = 'tgs';
            await bot.sendMessage(chat, {
                message: strings[lang]["animatedStickers"],
                parseMode: 'html',
                linkPreview: false
            });
        } else fileExt = mime.extension(file.mimeType);
    }

    if ((service === 'Catbox' && fileSize > 200000000) || (service === 'Litterbox' && fileSize > 1000000000))
        return bot.sendMessage(chat, { message: strings[lang]["err_FileTooBig"].replace('{s}', service) });

    editMsg = await bot.sendMessage(chat, { message: strings[lang]["downloading"], replyTo: msg.id });
    chatData[chat].downloading++;

    if (!fs.existsSync('./cache'))
        fs.mkdirSync('./cache');

    while (fs.existsSync(`./cache/${chat}_${fileName}.${fileExt}`))
        fileName = randomString();
    filePath = `./cache/${chat}_${fileName}.${fileExt}`;
    log(`Start downloading: ${filePath} (Size ${fileSize})...`);

    // The last time when the message is edited, in UNIX timestamp format
    let lastEditTime = Date.now();
    let lastDownloadSize = 0;
    try {
        await bot.downloadMedia(msg, {
            outputFile: filePath,
            progressCallback: (downloaded, total) => {
                // Limit the edit time interval to 2000 ms
                if (downloaded && Date.now() - lastEditTime > 3000) {
                    // Convert to MB
                    downloaded = (downloaded / 1000 / 1000).toFixed(2);
                    total = (total / 1000 / 1000).toFixed(2);
                    let speed = ((downloaded - lastDownloadSize) / 3).toFixed(2);
                    let text = strings[lang]["downloadProgress"]
                        .replace('{1}', total)
                        .replace('{2}', downloaded)
                        .replace('{3}', speed)
                        .replace('{4}', secToTime(Math.round((total - downloaded) / speed)));
                    let percent = Math.round(downloaded / total * 100);
                    text += '\n\n<code>[' + '●'.repeat(percent / 5.5) + '○'.repeat(18 - percent / 5.5) + ']</code>';
                    lastEditTime = Date.now();
                    lastDownloadSize = downloaded;
                    bot.editMessage(chat, {
                        message: editMsg.id,
                        text: text,
                        parseMode: 'html'
                    }).catch(() => { });
                }
            }
        });
        log(`Downloaded: ${filePath} (Size ${fileSize})`);
        await bot.editMessage(chat, { message: editMsg.id, text: strings[lang]["uploading"].replace('{s}', service) }).catch(() => { });
        // Upload to Catbox / Litterbox
        let result;
        if (service.toLowerCase() === 'catbox') {
            result = await Catbox.upload(filePath);
        } else
            result = await Litterbox.upload(filePath, chatData[chat].lbe);
        // If the result contains a link, which indicates upload was successful
        if (result && result.startsWith('https://')) {
            let text = strings[lang]["uploaded"]
                .replace('{1}', service)
                .replace('{2}', (fileSize / 1000 / 1000).toFixed(2))
                .replace('{3}', service.toLowerCase() === 'catbox' ? '∞' : (chatData[chat]["lbe"] + ` ${strings[lang]["hour"]}`))
                .replace('{4}', result)
                .replace('{5}', BOT_NAME);
            try {
                await bot.sendMessage(chat, {
                    message: text,
                    replyTo: msg.id,
                    parseMode: 'html'
                });
            }
            // If send message fails, try to reconnect and send again
            catch (e) {
                try {
                    await bot.connect().catch();
                    await bot.sendMessage(chat, {
                        message: text,
                        parseMode: 'html'
                    });
                }
                catch (e) {
                    await bot.sendMessage(chat, { message: strings[lang]["error"] + `\n\nError info: ${e.message}` }).catch(() => null);
                    log(`Download ${fileName} completed, but send message failed: ${e.message}`);
                }
            }
            chatData[chat].total++;
            log(`Uploaded ${filePath} to ${service}`);
        }
        // If not, return the error information to user
        else {
            await bot.sendMessage(chat, { message: strings[lang]["error"] + `\n\nResponse: ${result}`, replyTo: msg.id, parseMode: 'html' });
            console.error(`Upload ${filePath} failed, error: ${result}`);
        }
        if (LOG_CHANNEL_ID) {
            let log = await bot.forwardMessages(LOG_CHANNEL_ID, {
                messages: msg.id,
                fromPeer: chat
            }).catch(() => null);
            if (log) {
                await bot.sendMessage(LOG_CHANNEL_ID, {
                    message: `From: \`${chat}\`\nService: ${service}\nResult: \`${result}\``,
                    replyTo: log[0].id
                });
            }
        }
    }
    catch (e) {
        await bot.sendMessage(chat, { message: strings[lang]["error"] + `\n\nError info: ${e.message}`, replyTo: msg.id }).catch(() => { });
        log(`Download ${filePath} failed: ${e.message}`);
    }
    finally {
        if (fs.existsSync(filePath))
            fs.rmSync(filePath);
        chatData[chat].downloading--;
        bot.deleteMessages(chat, [editMsg.id], { revoke: true }).catch(() => null);
        log(`Finished transferring process for ${filePath}`);
    }
}

// Generates a random string with length e
function randomString(e = 8) {
    let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n;
}

function secToTime(sec) {
    let hour = Math.floor(sec / 3600);
    let min = Math.floor((sec - hour * 3600) / 60);
    let secs = sec - hour * 3600 - min * 60;
    return `${hour}:${min}:${secs}`;
}
