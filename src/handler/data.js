import 'dotenv/config';
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'fs';

export const { DEFAULT_LANG, DEFAULT_SERVICE, DEFAULT_EXPR, ADMIN_ID, MAX_DOWNLOADING, BOT_TOKEN, API_ID, API_HASH, LOG_CHANNEL_ID } = process.env;

export var chatData = {};
export const template = {
    lang: DEFAULT_LANG,
    downloading: 0,
    service: DEFAULT_SERVICE,
    lbe: DEFAULT_EXPR,
    banned: false
};

export function initChatData(user) {
    if (!chatData[user]) {
        chatData[user] = Object.assign({}, template);
        console.log(`User ${user} data initialized`);
    }
    saveBotData();
}

export function saveBotData() {
    writeFileSync('./data/chatsList.json', JSON.stringify(chatData));
}

function loadBotData() {
    if (!existsSync('./data/chatsList.json'))
        writeFileSync('./data/chatsList.json', JSON.stringify({}));
    else
        chatData = JSON.parse(readFileSync('./data/chatsList.json', 'utf-8')) || {};
    for (let chat in chatData)
        if (chatData[chat].downloading)
            chatData[chat].downloading = 0;
}

export function launchBot() {
    let i18n = readdirSync('./src/i18n');
    console.log('[Bot] Launching...');
    if (BOT_TOKEN && API_ID && API_HASH) {
        console.log('[Bot] Loading bot data...');
        loadBotData();
        console.log(`[Bot] Loaded data from ${Object.keys(chatData).length} chat(s)`);
        console.log(`[Bot] Loaded ${i18n.length} language(s) (found ${i18n.join(', ')})`);
        console.log('[Bot] Login to Telegram...');
        if (!existsSync('./cache'))
            mkdirSync('./cache');
        if (!existsSync('./data'))
            mkdirSync('./data');
    }
    else {
        console.error('[Bot] Please set BOT_TOKEN, API_ID and API_HASH in .env file');
        process.exit(1);
    }
}