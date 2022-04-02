import CatBox from "catbox.moe";
import { MAX_DOWNLOADING, chatData, LOG_CHANNEL_ID, CATBOX_TOKEN } from "./index.js";
import strings from "../strings.js";
import * as fs from "fs";
import { bot } from "../../index.js";
import mime from 'mime-types';
import { ADMIN_ID } from "./data.js";

export async function transfer(msg) {
    let chat = parseInt(msg.peerId.userId.value);
    let lang = chatData[chat].lang;

    if (chatData[chat].banned)
        return bot.sendMessage(chat, { message: strings[lang]["error_banned"] });
    else if (chatData[chat].downloading >= MAX_DOWNLOADING)
        return bot.sendMessage(chat, { message: strings[lang]["flood_protection"].replace('{s}', MAX_DOWNLOADING) });

    let Catbox = new CatBox.Catbox(chatData[chat].token || CATBOX_TOKEN || undefined);
    let Litterbox = new CatBox.Litterbox();
    let file = msg.media.document || msg.media.photo;
    let fileSize, fileExt, fileName = randomString(), filePath;
    let service = chatData[chat].service, editMsg;

    if (file.className === 'Photo') {
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

    try {
        await bot.downloadMedia(msg, {
            outputFile: filePath,
            progressCallback: (downloaded, total) => {
                // Limit the edit time interval to 2000 ms
                if (Date.now() - lastEditTime > 2000) {
                    lastEditTime = Date.now();
                    bot.editMessage(chat, {
                        message: editMsg.id,
                        text: strings[lang]["downloading"] + '...' + (downloaded / total * 100).toFixed(1) + '%'
                    }).catch(() => { });
                }
            }
        });
        log(`Downloaded: ${filePath} (Size ${fileSize})`);
        await bot.editMessage(chat, { message: editMsg.id, text: strings[lang]["uploading"].replace('{s}', service) }).catch(() => { });
    }
    catch (e) {
        await bot.sendMessage(chat, { message: strings[lang]["error"] + `\n\nError info: ${e.message}`, replyTo: msg.id }).catch(() => { });
        log(`Download ${filePath} failed: ${e.message}`, true);
    }
    // Upload to Catbox / Litterbox
    try {
        let result;
        if (service.toLowerCase() === 'catbox') {
            result = await Catbox.upload(filePath);
        } else
            result = await Litterbox.upload(filePath, chatData[chat].lbe);
        // If the result contains a link, which indicates upload was successful
        if (result && result.startsWith('https://')) {
            await bot.sendMessage(chat, {
                message: strings[lang]["uploaded"]
                    .replace('{1}', service)
                    .replace('{2}', service.toLowerCase() === 'catbox' ? '∞' : (chatData[chat]["lbe"] + ` ${strings[lang]["hour"]}`))
                    .replace('{3}', result),
                replyTo: msg.id
            });
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
            }).catch(console.error);
            await bot.sendMessage(LOG_CHANNEL_ID, {
                message: `From: \`${chat}\`\nService: ${service}\nResult: \`${result}\``,
                replyTo: log[0].id
            });
        }
    }
    catch (e) {
        log(`Upload ${filePath} failed: ${e.message}`, true);
        await bot.sendMessage(chat, { message: strings[lang]["error"] + `\n\nError info: ${e.message}`, replyTo: msg.id });
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

/**
 *  log wrapper with timestamp
 *  @param {string} text Log content
 *  @param {boolean} alert If true, send the content to bot owner via Telegram
 */
export function log(text, alert = false) {
    console.log(new Date().toLocaleString('zh-CN') + ': ' + text);
    if (alert) {
        bot.sendMessage(ADMIN_ID, { message: text }).catch(() => { });
    }
}