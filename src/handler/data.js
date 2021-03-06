import 'dotenv/config';
import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { bot } from "../../index.js";
import strings from "../strings.js";

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

// console.log, with date added
export function log(...text) {
    console.log(`[${new Date().toISOString()}] [Bot] - ${text.join(' ')}`);
}

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

export function loadBotData() {
    log('Loading bot data...');
    if (!existsSync('./data'))
        mkdirSync('./data');
    if (existsSync('./data/chatsList.json'))
        chatData = JSON.parse(readFileSync('./data/chatsList.json', 'utf-8')) || {};
    for (let chat in chatData)
        if (chatData[chat].downloading) {
            chatData[chat].downloading = 0;
            bot.sendMessage(chat, { message: strings[chatData[chat].lang]["error"] }).catch();
        }
    let i18n = readdirSync('./src/i18n');
    log(`Loaded data from ${Object.keys(chatData).length} chat(s)`);
    log(`Loaded ${i18n.length} language(s) (found ${i18n.join(', ')})`);
}

export function launchBot() {
    log('Launching...');
    if (BOT_TOKEN && API_ID && API_HASH)
        log('Login to Telegram...');
    else {
        console.error('Please set BOT_TOKEN, API_ID and API_HASH in .env file');
        process.exit(1);
    }
}