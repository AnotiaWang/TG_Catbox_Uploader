import strings from "../strings.js";
import { chatData, ADMIN_ID, buttons, initChatData, saveBotData } from "./index.js";
import { bot, BOT_NAME } from "../../index.js";
import CatBox from "catbox.moe";

export async function handleCommand(msg) {
    let text = msg.message, chat = parseInt(msg.peerId.userId.value);
    let command = text.split(" ")[0].substring(1);
    let mention = command.split("@")[1];
    if (mention && mention !== BOT_NAME)
        return;
    command = command.split('@')[0];
    let arg = text.split(" ").slice(1).join(" ");
    if (GeneralCommands.prototype.hasOwnProperty(command))
        new GeneralCommands(msg)[command](arg);
    else if (OwnerCommands.prototype.hasOwnProperty(command) && chat.toString() === ADMIN_ID)
        new OwnerCommands(msg)[command](arg);
}

class OwnerCommands {
    constructor(msg) {
        this.chat = parseInt(msg.peerId.userId.value);
        this.lang = chatData[this.chat].lang;
    }

    ban(arg) {
        if (arg) {
            let user = parseInt(arg);
            if (chatData[user]) {
                chatData[user].banned = true;
                saveBotData();
                bot.sendMessage(this.chat, { message: strings[this.lang].banned })
                    .catch(console.error);
            } else
                bot.sendMessage(this.chat, { message: strings[this.lang].userNotFound })
                    .catch(console.error);
        } else
            bot.sendMessage(this.chat, { message: 'Usage: /ban UID' })
                .catch(console.error);
    }

    unban(arg) {
        if (arg) {
            let user = parseInt(arg);
            if (chatData[user]) {
                chatData[user].banned = false;
                saveBotData();
                bot.sendMessage(this.chat, { message: strings[this.lang].unbanned })
                    .catch(console.error);
            } else
                bot.sendMessage(this.chat, { message: strings[this.lang].userNotFound })
                    .catch(console.error);
        } else
            bot.sendMessage(this.chat, { message: 'Usage: /unban UID' })
                .catch(console.error);
    }
}

class GeneralCommands {
    constructor(msg) {
        this.chat = parseInt(msg.peerId.userId.value);
        this.lang = chatData[this.chat].lang;
    }

    start() {
        bot.sendMessage(this.chat, {
            message: '🐱 <b>欢迎！请在下方选择您的语言。发送 /help 命令查看帮助。\n\nWelcome! Please select a language below. Send /help to see what I can do.</b>',
            parseMode: 'html',
            buttons: buttons.getLanguagesButtons(this.lang)
        }).catch(console.error);
    }

    help() {
        bot.sendMessage(this.chat, {
            message: strings[this.lang].help,
            parseMode: 'html',
            linkPreview: false
        }).catch(console.error);
    }

    settings() {
        bot.sendMessage(this.chat, {
            message: strings[this.lang].settings,
            parseMode: 'html',
            buttons: buttons.mainSettings(this.chat)
        }).catch(console.error);
    }

    async stats() {
        let total = 0, downloading = 0;
        for (let chat in chatData) {
            initChatData(chat);
            downloading += chatData[chat].downloading;
            total += chatData[chat].total;
        }
        await bot.sendMessage(this.chat, {
            message: strings[this.lang].stats
                .replace('{1}', Object.keys(chatData).length)
                .replace('{2}', downloading)
                .replace('{3}', total)
                .replace('{4}', chatData[this.chat].total),
            parseMode: 'html',
        }
        );
    }

    async delete(link) {
        if (link) {
            if (chatData[this.chat].token) {
                let Catbox = new CatBox.Catbox(chatData[this.chat].token);
                let result = await Catbox.delete(link), text;
                {
                    if (result.includes('successful'))
                        text = strings[this.lang].deleteFileSuccess;
                    else if (result.includes('doesn\'t exist'))
                        text = strings[this.lang].operationFailed.replace('{s}', strings[this.lang].fileNotFound);
                    else if (result.includes('didn\'t belong to'))
                        text = strings[this.lang].operationFailed.replace('{s}', strings[this.lang].fileWrongOwnership);
                    else text = strings[this.lang].unknownError;
                    await bot.sendMessage(this.chat, { message: text });
                }
            } else await bot.sendMessage(this.chat, {
                message: strings[this.lang].err_TokenNeeded,
                parseMode: 'html',
                linkPreview: false
            });
        } else await bot.sendMessage(this.chat, {
            message: strings[this.lang].help_delete,
            parseMode: 'html'
        })
    }

    async token(token) {
        if (token) {
            chatData[this.chat].token = token;
            await bot.sendMessage(this.chat, { message: strings[this.lang].setSuccess });
        } else
            await bot.sendMessage(this.chat, {
                message: strings[this.lang].help_token.replace('{t}', chatData[this.chat].token || '🚫'),
                parseMode: 'html',
                linkPreview: false
            });
    }
}

export function isGroup(ctx) {
    return ctx.message.chat.type === 'group' || ctx.message.chat.type === 'supergroup';
}

