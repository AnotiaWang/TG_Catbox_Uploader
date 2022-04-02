import strings from "../strings.js";
import { Button } from "telegram/tl/custom/button.js";
import { chatData } from "./data.js";

// Shorthand for the buttons
function cb(text, data) {
    return Button.inline(text, Buffer.from(data));
}

// Select a storage service (Catbox / Litterbox)
const setService = (chat) => {
    let t = (current) => chatData[chat].service === current ? ' ✅' : '';
    return [[
        cb(`Catbox${t('Catbox')}`, 'setService_Catbox'),
        cb(`Litterbox${t('Litterbox')}`, 'setService_Litterbox')],
    back(chatData[chat].lang)[0]
    ];
}

// The main menu of settings
const mainSettings = (chat) => {
    let lang = chatData[chat].lang;
    return [[
        cb(strings[lang]["settings_setLang"] + ` (${strings[lang]["name"]})`, 'setLang')], [
        cb(strings[lang]["settings_setService"] + ` (${chatData[chat]["service"]})`, 'setService')], [
        cb(strings[lang]["settings_setExpr"] + ` (${chatData[chat]["lbe"]} ${strings[lang]["hour"]})`, 'setLBE')], [
        cb(strings[lang]["token"], 'setToken')
    ]];
}

// Set the language of the bot
const setLanguage = (lang) => {
    let buttons = [], tmp = [];
    for (let i18n in strings) {
        tmp.push(cb(strings[i18n]["name"] + (lang === i18n ? ' ✅' : ''), `setLang_${i18n}`));
        if (tmp.length === 2) {
            buttons.push(tmp);
            tmp = [];
        }
    }
    if (tmp.length > 0)
        buttons.push(tmp);
    buttons.push(back(lang)[0]);
    return buttons;
}

const setLitterBoxExpiration = (lang, chat) => {
    let hour = strings[lang]["hour"];
    let t = (current) => chatData[chat]["lbe"] === current ? ' ✅' : '';
    return [[
        cb(`1 ${hour}${t(1)}`, 'setLBE_1'),
        cb(`12 ${hour}${t(12)}`, 'setLBE_12')
    ], [
        cb(`24 ${hour}${t(24)}`, 'setLBE_24'),
        cb(`72 ${hour}${t(72)}`, 'setLBE_72')
    ], back(lang)[0]];
}

// Set the token of Catbox
const setToken = (chat) => {
    let lang = chatData[chat]["lang"];
    let bt = [back(lang)[0]];
    if (chatData[chat]["token"])
        bt.unshift([cb(strings[lang]["unbindToken"], 'setToken_unbind')]);
    return bt;
}

// Back button
const back = (lang) => {
    return [[cb(strings[lang]["settings_back"], 'back')]];
}

export { setLanguage, mainSettings, setService, setLitterBoxExpiration, back, setToken };