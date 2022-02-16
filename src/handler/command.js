import strings  from "../strings.js";
import { chatData, ADMIN_ID, buttons } from "./index.js";
import { bot } from "../../index.js";

export async function handleCommand(msg) {
    let text = msg.message, chat = parseInt(msg.peerId.userId.value);;
    let command = text.split(" ")[0].substring(1);
    let mention = command.split("@")[1];
    if (mention && mention !== msg.me)
        return;
    command = command.split('@')[0];
    if (GeneralCommands.prototype.hasOwnProperty(command))
        new GeneralCommands(msg)[command]();
    else if (OwnerCommands.prototype.hasOwnProperty(command) && chat.toString() === ADMIN_ID)
        new OwnerCommands(msg)[command]();
}

class OwnerCommands {
    constructor(msg) {
        this.chat = parseInt(msg.peerId.userId.value);
        this.lang = chatData[this.chat].lang;
    }
}

class GeneralCommands {
    constructor(msg) {
        this.chat = parseInt(msg.peerId.userId.value);
        this.lang = chatData[this.chat].lang;
    }
    start() {
        bot.sendMessage(this.chat, {
            message: '🐱 <b>欢迎！请选择您的语言：\n\nWelcome! Please select a language:</b>',
            parseMode: 'html',
            buttons: buttons.getLanguagesButtons(this.lang)
        }).catch(console.error);
    }

    help() {
        bot.sendMessage(this.chat, { message: strings[this.lang].help, parseMode: 'html', linkPreview: false }).catch(console.error);
    }

    settings() {
        bot.sendMessage(this.chat, {
            message: strings[this.lang].settings,
            parseMode: 'html',
            buttons: buttons.mainSettings(this.lang)
        }).catch(console.error);
    }
}

export function isGroup(ctx) {
    return ctx.message.chat.type === 'group' || ctx.message.chat.type === 'supergroup';
}

