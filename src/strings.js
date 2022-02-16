import { readdirSync, readFileSync } from 'fs';

let i18n = readdirSync('./src/i18n');
let strings = {};
for (let lang of i18n) {
    strings[lang.split('.')[0]] = JSON.parse(readFileSync(`./src/i18n/${lang}`, 'utf-8'));
}

export default strings;