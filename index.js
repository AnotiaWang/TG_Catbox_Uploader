import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { handleMessage, handleCallbackQuery, launchBot, loadBotData, BOT_TOKEN, API_ID, API_HASH } from "./src/handler/index.js";
import { LogLevel } from "telegram/extensions/Logger.js";
import { CallbackQuery } from "telegram/events/CallbackQuery.js";
import { NewMessage } from "telegram/events/index.js";
import { log } from "./src/handler/data.js";

const stringSession = new StringSession(existsSync('./data/.session') ? readFileSync('./data/.session', 'utf-8') : "");

launchBot();
export const bot = new TelegramClient(stringSession, parseInt(API_ID), API_HASH, {connectionRetries: 3});
await bot.start({
    botAuthToken: BOT_TOKEN
});
await bot.connect();
loadBotData();
export const BOT_NAME = (await bot.getMe()).username;
writeFileSync('./data/.session', bot.session.save());
log('Launched successfully.');

bot.setLogLevel(LogLevel.ERROR);
bot.addEventHandler(handleMessage, new NewMessage({}));
bot.addEventHandler(handleCallbackQuery, new CallbackQuery());

process.on('unhandledRejection', (reason, promise) => {
    console.error(reason, 'Unhandled Rejection at', promise);
}).on('uncaughtException', error => {
    console.error(error, 'Uncaught Exception thrown');
});