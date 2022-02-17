import CatBoxMoe from "catbox.moe";
import { MAX_DOWNLOADING, chatData, LOG_CHANNEL_ID, CATBOX_TOKEN } from "./index.js";
import strings from "../strings.js";
import * as fs from "fs";
import { bot } from "../../index.js";
import mime from 'mime-types';

const CatBox = new CatBoxMoe.Catbox(CATBOX_TOKEN);
const LitterBox = new CatBoxMoe.Litterbox();

export async function transfer(msg) {
    let chat = parseInt(msg.peerId.userId.value);
    let file = msg.media, fileSize, fileExt, fileName = randomString(), filePath;
    let lang = chatData[chat].lang, service = chatData[chat].service, editMsg;

    if (chatData[chat].banned)
        return bot.sendMessage(chat, { message: strings[lang].error_banned });
    if (chatData[chat].downloading >= MAX_DOWNLOADING)
        return bot.sendMessage(chat, { message: strings[lang].flood_protection.replace('{s}', MAX_DOWNLOADING) });

    if (file.document) {
        fileSize = file.document.size;
        if (file.document.mimeType === 'application/x-tgsticker') {
            fileExt = 'tgs';
            await bot.sendMessage(chat, { message: strings[lang].animatedStickers, parseMode: 'html', linkPreview: false });
        }
        else
            fileExt = mime.extension(file.document.mimeType);
    }
    else if (file.photo) {
        let sizes = file.photo.sizes[file.photo.sizes.length - 1].sizes;
        fileSize = sizes[sizes.length - 1];
        fileExt = 'png';
    }

    if ((service === 'Catbox' && fileSize > 200000000) || (service === 'Litterbox' && fileSize > 1000000000))
        return bot.sendMessage(chat, { message: strings[lang].err_FileTooBig.replace('{s}', service) });

    editMsg = await bot.sendMessage(chat, { message: strings[lang].downloading, replyTo: msg.id });
    chatData[chat].downloading++;

    if (!fs.existsSync('./cache'))
        fs.mkdirSync('./cache');

    while (fs.existsSync(`./cache/${chat}_${fileName}.${fileExt}`))
        fileName = randomString();
    filePath = `./cache/${chat}_${fileName}.${fileExt}`;
    console.log(`Downloading: ${filePath}`);
    let buffer = await bot.downloadMedia(file, {});
    fs.writeFileSync(filePath, buffer);
    console.log(`Downloaded ${filePath}, now uploading...`);
    await bot.editMessage(chat, { message: editMsg.id, text: strings[lang].uploading.replace('{s}', service) });
    let result = 'None';
    try {
        if (service.toLowerCase() === 'catbox') {
            result = await CatBox.upload(filePath).catch((e) => {
                throw new Error(e);
            });
        }
        else
            result = await LitterBox.upload(filePath, chatData[chat].lbe).catch((e) => {
                throw new Error(e);
            });
        bot.sendMessage(chat, {
            message: strings[lang].uploaded
                .replace('{1}', service)
                .replace('{2}', service.toLowerCase() === 'catbox' ? '∞' : (chatData[chat].lbe + ` ${strings[lang].hour}`))
                .replace('{3}', result),
            replyTo: msg.id
        }).catch(() => null);
        chatData[chat].total++;
        console.log(`Uploaded ${filePath} to ${service}`);
    }
    catch (e) {
        console.error(`Upload ${filePath} failed:`, e.message);
        await bot.sendMessage(chat, { message: strings[lang].error + `\n\n${e.message}`, replyTo: msg.id });
    }
    finally {
        fs.rmSync(filePath);
        chatData[chat].downloading--;
        bot.deleteMessages(chat, [editMsg.id], { revoke: true }).catch(() => null);
        if (LOG_CHANNEL_ID) {
            let log = await bot.forwardMessages(LOG_CHANNEL_ID, { messages: msg.id, fromPeer: chat }).catch(console.error);
            await bot.sendMessage(LOG_CHANNEL_ID, { message: `From: \`${chat}\`\nService: ${service}\nResult: \`${result}\``, replyTo: log[0].id });
        }
    }
}

function randomString(e = 8) {
    let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n;
}