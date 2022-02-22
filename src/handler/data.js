import 'dotenv/config';
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'fs';

export const {
    DEFAULT_LANG,
    DEFAULT_SERVICE,
    DEFAULT_EXPR,
    ADMIN_ID,
    MAX_DOWNLOADING,
    BOT_TOKEN,
    API_ID,
    API_HASH,
    LOG_CHANNEL_ID,
    CATBOX_TOKEN
} = process.env;

export var chatData = {};
export const chatDataTemplate = {
    lang: DEFAULT_LANG,
    downloading: 0,
    total: 0,
    service: DEFAULT_SERVICE,
    lbe: parseInt(DEFAULT_EXPR),
    banned: false,
    token: ''
};

export function initChatData(user) {
    if (!chatData[user]) {
        chatData[user] = Object.assign({}, chatDataTemplate);
        console.log(`User ${user} data initialized`);
    } else
        for (let key in chatDataTemplate) {
            if (!chatData[user][key]) {
                chatData[user][key] = chatDataTemplate[key];
            }
        }
    saveBotData();
}

export function saveBotData() {
    writeFileSync('./data/chatsList.json', JSON.stringify(chatData));
}

function loadBotData() {
    if (!existsSync('./data'))
        mkdirSync('./data');
    if (existsSync('./data/chatsList.json'))
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
    } else {
        console.error('[Bot] Please set BOT_TOKEN, API_ID and API_HASH in .env file');
        process.exit(1);
    }
}