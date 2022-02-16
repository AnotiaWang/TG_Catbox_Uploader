import strings from "../strings.js";
import { chatData, initChatData, buttons, saveBotData } from "./index.js";
import { bot } from "../../index.js";

export async function handleCallbackQuery(update) {
    console.log(update)
    let chat = parseInt(update.userId.value);
    let data = update.data.toString();
    let arg = data.includes('_') ? data.slice(data.indexOf("_") + 1) : null;
    initChatData(chat);
    let lang = chatData[chat].lang;
    // Buttons, Text
    let bt = [], text = '🐱 Blank';
    if (data.startsWith('setLang')) {
        if (arg)
            chatData[chat].lang = lang = arg;
        bt = buttons.getLanguagesButtons(lang);
        text = strings[lang].settings_setLang;
    }
    else if (data.startsWith('setService')) {
        if (arg)
            chatData[chat].service = arg;
        bt = buttons.setService(chat);
        text = strings[lang].settings_setService;
    }
    // Set Litterbox Expiration
    else if (data.startsWith('setLBE')) {
        if (arg)
            chatData[chat].lbe = parseInt(arg);
        bt = buttons.setLitterBoxExpiration(lang, chat);
        text = strings[lang].settings_setExpr;
    }
    else if (data === 'back') {
        bt = buttons.mainSettings(lang);
        text = strings[lang].settings;
    }
    saveBotData();
    if (data !== 'back')
        bt.push(buttons.back(lang)[0]);
    bot.editMessage(chat, {
        message: update.msgId,
        text: text,
        parseMode: 'html',
        buttons: bt
    }).catch();
}