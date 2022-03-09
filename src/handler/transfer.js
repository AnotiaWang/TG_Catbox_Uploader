import CatBox from "catbox.moe";
import { MAX_DOWNLOADING, chatData, LOG_CHANNEL_ID, CATBOX_TOKEN } from "./index.js";
import strings from "../strings.js";
import * as fs from "fs";
import { bot } from "../../index.js";
import mime from 'mime-types';
import { Api } from "telegram";
import { freemem } from 'os';
import { createHash } from 'crypto';

export async function transfer(msg) {
    function getFileQuery(id, accessHash, fileReference, offset, limit) {
        return new Api.upload.GetFile({
            location: new Api.InputDocumentFileLocation({
                id: id,
                accessHash: accessHash,
                fileReference: fileReference,
                thumbSize: ''
            }),
            limit: limit,
            offset: offset,
            precise: true
        });
    }

    function getFileHashQuery(id, accessHash, fileReference, offset) {
        return new Api.upload.GetFileHashes({
            location: new Api.InputDocumentFileLocation({
                id: id,
                accessHash: accessHash,
                fileReference: fileReference,
                thumbSize: ''
            }),
            offset: offset
        });
    }

    let chat = parseInt(msg.peerId.userId.value);
    let file = msg.media.document || msg.media.photo;
    let fileSize, fileExt, fileName = randomString(), filePath;
    let lang = chatData[chat].lang, service = chatData[chat].service, editMsg, isDownloadSuccess = false, errMsg = '', retry = 0;
    let Catbox = new CatBox.Catbox(chatData[chat].token || CATBOX_TOKEN || undefined);
    let Litterbox = new CatBox.Litterbox();

    if (chatData[chat].banned)
        return bot.sendMessage(chat, { message: strings[lang].error_banned });
    if (chatData[chat].downloading >= MAX_DOWNLOADING)
        return bot.sendMessage(chat, { message: strings[lang].flood_protection.replace('{s}', MAX_DOWNLOADING) });

    if (file.className === 'Photo') {
        fileSize = file.sizes[file.sizes.length - 1].sizes.pop();
        fileExt = 'jpg';
    } else {
        fileSize = file.size;
        if (file.mimeType === 'application/x-tgsticker') {
            fileExt = 'tgs';
            await bot.sendMessage(chat, {
                message: strings[lang].animatedStickers,
                parseMode: 'html',
                linkPreview: false
            });
        } else fileExt = mime.extension(file.mimeType);
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
    console.log(`Start downloading: ${filePath} (Size ${fileSize})...`);

    // File size < 20 MB
    if (fileSize < 20000000) {
        try {
            let buffer = await bot.downloadMedia(file, {});
            fs.writeFileSync(filePath, buffer);
            isDownloadSuccess = true;
        } catch (err) {
            errMsg = err.message;
        }
    } else {
        try {
            let offset = 0;
            let sender = await bot.getSender(file.dcId);
            let ws = fs.createWriteStream(filePath);

            while (offset < fileSize) {
                let chunks;
                try {
                    chunks = await sender.send(getFileHashQuery(file.id, file.accessHash, file.fileReference, offset));
                } catch (e) {
                    console.log(`Get chunks failed：${e.message}`);
                    if (e.message.toLowerCase().includes('disconnect')) {
                        console.log(`${filePath} connection lost, retrying...`);
                        await sleep(5000);
                        await bot.connect();
                        retry++;
                        if (retry > 3)
                            throw e;
                        else continue;
                    } else throw e;
                }
                for (let i = 0; i < chunks.length; i++) {
                    let tempHash = createHash('sha256'), chunkData;
                    try {
                        chunkData = (await sender.send(getFileQuery(file.id, file.accessHash, file.fileReference, chunks[i].offset, chunks[i].limit))).bytes;
                    } catch (e) {
                        console.log(`Download chunk failed:`, e.message);
                        if (e.message.toLowerCase().includes('disconnect')) {
                            console.log(`Connection lost, retrying...`);
                            await sleep(5000);
                            await bot.connect();
                            i--;
                            retry++;
                            if (retry > 3)
                                throw e;
                            else continue;
                        }
                    }
                    tempHash.update(chunkData);
                    if (tempHash.digest('hex') === chunks[i].hash.toString('hex')) {
                        ws.write(chunkData);
                    } else i--;
                }
                await bot.editMessage(chat, {
                    message: editMsg.id,
                    text: strings[lang].downloading + ` (${Math.floor(offset / fileSize * 100)}%)`,
                }).catch(() => {
                });
                offset = chunks[chunks.length - 1].offset + chunks[chunks.length - 1].limit;
            }
            ws.end();
            console.log(`Download completed: ${filePath}`);
            isDownloadSuccess = true;
        } catch (e) {
            console.log(`Failed to download ${filePath} by chunks, try downloadMedia. Reason:`, e.message);
            await bot.editMessage(chat, { message: editMsg.id, text: strings[lang].downloading }).catch(() => { });
            if (fileSize > freemem()) {
                console.log(`Cannot download ${filePath}: Out of Memory`);
                errMsg = strings[lang].error_outOfMemory;
            } else {
                try {
                    let buffer = await bot.downloadMedia(file, {});
                    fs.writeFileSync(filePath, buffer);
                    isDownloadSuccess = true;
                } catch (e) {
                    console.log(`Failed to download ${filePath} by downloadMedia`);
                    errMsg = e.message;
                }
            }
        }
    }

    if (isDownloadSuccess) {
        console.log(`Downloaded ${filePath}, now uploading...`);
        await bot.editMessage(chat, { message: editMsg.id, text: strings[lang].uploading.replace('{s}', service) });
        let result = 'None';
        try {
            if (service.toLowerCase() === 'catbox') {
                result = await Catbox.upload(filePath);
            } else
                result = await Litterbox.upload(filePath, chatData[chat].lbe);
            // If the result contains a link, which indicates the transfer was successful
            if (result.startsWith('https://')) {
                await bot.sendMessage(chat, {
                    message: strings[lang].uploaded
                        .replace('{1}', service)
                        .replace('{2}', service.toLowerCase() === 'catbox' ? '∞' : (chatData[chat].lbe + ` ${strings[lang].hour}`))
                        .replace('{3}', result),
                    replyTo: msg.id
                });
                chatData[chat].total++;
                console.log(`Uploaded ${filePath} to ${service}`);
            }
            else {
                await bot.sendMessage(chat, { message: strings[lang].error + `\n\nResponse: ${result}`, replyTo: msg.id, parseMode: 'html' });
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
        } catch (e) {
            console.error(`Upload ${filePath} failed:`, e.message);
            await bot.sendMessage(chat, { message: strings[lang].error + `\n\n${e.message}`, replyTo: msg.id });
        }
    } else
        await bot.sendMessage(chat, { message: strings[lang].error + `\n\n${errMsg}`, replyTo: msg.id });
    fs.rmSync(filePath);
    chatData[chat].downloading--;
    bot.deleteMessages(chat, [editMsg.id], { revoke: true }).catch(() => null);
    console.log(`Finished transferring process for ${filePath}`);
}

function randomString(e = 8) {
    let t = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));