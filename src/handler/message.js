import { chatData, handleCommand, initChatData, transfer } from "./index.js";
import { bot } from "../../index.js";
import strings from "../strings.js";

// Message handler
export async function handleMessage(event) {
    const msg = event.message;
    const chatId = parseInt(msg.peerId.userId.value);
    // Check if the user has configured the bot
    initChatData(chatId);
    // Currently, only support private messages
    if (msg.peerId.className !== 'PeerUser') return;
    const lang = chatData[chatId].lang;

    if (isCommand(msg.message))
        await handleCommand(msg);
    else if (msg.media)
        await transfer(msg);
    else {
        bot.sendMessage(chatId, {
            message: strings[lang]["sendMeAFile"]
        }).catch(() => null);
    }
}

function isCommand(message) {
    return message.startsWith("/");
}