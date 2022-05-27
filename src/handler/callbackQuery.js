import strings from "../strings.js";
import { chatData, initChatData, buttons, saveBotData } from "./index.js";
import { bot } from "../../index.js";

// Callback query handler
// I use callback queries in the format of: [callback function]_[argument]
export async function handleCallbackQuery(event) {
    const query = event.query;
    const chat = parseInt(query.userId.value);
    const data = query.data.toString();
    const arg = data.includes('_') ? data.slice(data.indexOf("_") + 1) : null;
    let lang = chatData[chat].lang;
    initChatData(chat);
    if (!bot.connected) await bot.connect();
    // Buttons, Text
    let bt = [], text = '🐱 Blank';
    if (data.startsWith('setLang')) {
        if (arg)
            chatData[chat].lang = lang = arg;
        else {
            bt = buttons.setLanguage(lang);
            text = `<b>${strings[lang]["settings_setLang"]}</b>\n\n` + strings[lang]["help_setLang"];
        }
    }
    else if (data.startsWith('setService')) {
        if (arg)
            chatData[chat].service = arg;
        else {
            bt = buttons.setService(chat);
            text = `<b>${strings[lang]["settings_setService"]}</b>\n\n` + strings[lang]["help_setService"];
        }
    }
    // Set Litterbox Expiration
    else if (data.startsWith('setLBE')) {
        if (arg)
            chatData[chat].lbe = parseInt(arg);
        else {
            bt = buttons.setLitterBoxExpiration(lang, chat);
            text = `<b>${strings[lang]["settings_setExpr"]}</b>\n\n` + strings[lang]["help_setExpr"];
        }
    }
    else if (data.startsWith('setToken')) {
        if (arg && arg === 'unbind')
            chatData[chat].token = '';
        text = `<b>${strings[lang]["token"]}</b>\n\n` + strings[lang]["help_token"].replace('{t}', chatData[chat].token || '🚫');
        bt = buttons.setToken(chat);
    }
    saveBotData();
    if (!bt.length) {
        bt = buttons.mainSettings(chat);
        text = `<b>${strings[lang]["settings"]}</b>\n\n` + strings[lang]["help_settings"];
    }
    bot.editMessage(chat, {
        message: query.msgId,
        text: text,
        parseMode: 'html',
        linkPreview: false,
        buttons: bt
    }).catch();
    await event.answer({ message: arg ? strings[lang]["setSuccess"] : '' });
}