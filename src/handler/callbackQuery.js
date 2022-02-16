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
        bt = buttons.getLanguagesButtons(lang);
        text = `<b>${strings[lang].settings_setLang}</b>` + strings[lang].help_setLang;
    }
    else if (data.startsWith('setService')) {
        if (arg)
            chatData[chat].service = arg;
        bt = buttons.setService(chat);
        text = `<b>${strings[lang].settings_setService}</b>` + strings[lang].help_setService;
    }
    // Set Litterbox Expiration
    else if (data.startsWith('setLBE')) {
        if (arg)
            chatData[chat].lbe = parseInt(arg);
        bt = buttons.setLitterBoxExpiration(lang, chat);
        text = `<b>${strings[lang].settings_setExpr}</b>`;
    }
    else if (data === 'back') {
        bt = buttons.mainSettings(lang);
        text = `<b>${strings[lang].settings}</b>` + strings[lang].help_settings;
    }
    saveBotData();
    if (data !== 'back')
        bt.push(buttons.back(lang)[0]);
    bot.editMessage(chat, {
        message: query.msgId,
        text: text,
        parseMode: 'html',
        linkPreview: false,
        buttons: bt
    }).catch();
    await event.answer({ message: arg ? strings[lang].setSuccess : '' });
}