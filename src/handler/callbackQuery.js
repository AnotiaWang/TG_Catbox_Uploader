import strings from "../strings.js";
import { chatData, initChatData, buttons, saveBotData } from "./index.js";
import { bot } from "../../index.js";

export async function handleCallbackQuery(event) {
    let query = event.query;
    let chat = parseInt(query.userId.value);
    let data = query.data.toString();
    let arg = data.includes('_') ? data.slice(data.indexOf("_") + 1) : null;
    initChatData(chat);
    let lang = chatData[chat].lang;
    // Buttons, Text
    let bt = [], text = '🐱 Blank';
    if (data.startsWith('setLang')) {
        if (arg)
            chatData[chat].lang = lang = arg;
        else {
            bt = buttons.getLanguagesButtons(lang);
            text = `<b>${strings[lang].settings_setLang}</b>\n\n` + strings[lang].help_setLang;
        }
    }
    else if (data.startsWith('setService')) {
        if (arg)
            chatData[chat].service = arg;
        else {
            bt = buttons.setService(chat);
            text = `<b>${strings[lang].settings_setService}</b>\n\n` + strings[lang].help_setService;
        }
    }
    // Set Litterbox Expiration
    else if (data.startsWith('setLBE')) {
        if (arg)
            chatData[chat].lbe = parseInt(arg);
        else {
            bt = buttons.setLitterBoxExpiration(lang, chat);
            text = `<b>${strings[lang].settings_setExpr}</b>\n\n` + strings[lang].help_setExpr;
        }
    }
    else if (data.startsWith('setToken')) {
        if (arg && arg === 'unbind')
            chatData[chat].token = '';
        text = `<b>${strings[lang].token}</b>\n\n` + strings[lang].help_token.replace('{t}', chatData[chat].token || '🚫');
        bt = buttons.setToken(chat);
    }
    // else if (data === 'back') { }
    saveBotData();
    if (!bt.length) {
        bt = buttons.mainSettings(chat);
        text = `<b>${strings[lang].settings}</b>\n\n` + strings[lang].help_settings;
    }
    bot.editMessage(chat, {
        message: query.msgId,
        text: text,
        parseMode: 'html',
        linkPreview: false,
        buttons: bt
    }).catch();
    await event.answer({ message: arg ? strings[lang].setSuccess : '' });
}