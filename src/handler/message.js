import { chatData, handleCommand, initChatData, transfer } from "./index.js";
import { bot } from "../../index.js";
import strings from "../strings.js";

// Message handler
export async function handleMessage(event) {
    const msg = event.message;
    // Currently, only support private messages
    if (msg.peerId.className !== 'PeerUser') return;
    const chat = parseInt(msg.peerId.userId.value);
    const lang = chatData[chat].lang;
    // Check if the user has configured the bot
    initChatData(chat);
    if (isCommand(msg.message))
        await handleCommand(msg);
    else if (msg.media)
        await transfer(msg);
    else {
        bot.sendMessage(chat, {
            message: strings[lang]["sendMeAFile"]
        }).catch(() => null);
    }
}

function isCommand(message) {
    return message.startsWith("/");
}