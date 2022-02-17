import strings from "../strings.js";
import { Button } from "telegram/tl/custom/button.js";
import { chatData } from "./data.js";

function cb(text, data) {
    return Button.inline(text, Buffer.from(data));
}

const setService = (chat) => {
    let t = (current) => chatData[chat].service === current ? ' ✅' : '';
    return [[
        cb(`Catbox${t('Catbox')}`, 'setService_Catbox'),
        cb(`Litterbox${t('Litterbox')}`, 'setService_Litterbox')],
        back(chatData[chat].lang)[0]
    ];
}

const mainSettings = (chat) => {
    let lang = chatData[chat].lang;
    return [[
        cb(strings[lang].settings_setLang + ` (${strings[lang].name})`, 'setLang')], [
        cb(strings[lang].settings_setService + ` (${chatData[chat].service})`, 'setService')], [
        cb(strings[lang].settings_setExpr + ` (${chatData[chat].lbe} ${strings[lang].hour})`, 'setLBE')
    ]];
}

const getLanguagesButtons = (lang) => {
    let buttons = [], tmp = [];
    for (let i18n in strings) {
        tmp.push(cb(strings[i18n].name + (lang === i18n ? ' ✅' : ''), `setLang_${i18n}`));
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
    let hour = strings[lang].hour;
    let t = (current) => chatData[chat].lbe === current ? ' ✅' : '';
    return [[
        cb(`1 ${hour}${t(1)}`, 'setLBE_1'),
        cb(`12 ${hour}${t(12)}`, 'setLBE_12')
    ], [
        cb(`24 ${hour}${t(24)}`, 'setLBE_24'),
        cb(`72 ${hour}${t(72)}`, 'setLBE_72')
    ], back(lang)[0]];
}

const back = (lang) => {
    return [[cb(strings[lang].settings_back, 'back')]];
}

export { getLanguagesButtons, mainSettings, setService, setLitterBoxExpiration, back };