import { chatData, handleCommand, initChatData, transfer } from "./index.js";
import { bot } from "../../index.js";
import strings from "../strings.js";

// Message handler
export async function handleMessage(event) {
    let msg = event.message;
    // Currently, only support private messages
    if (msg.peerId.className !== 'PeerUser') return;
    let chat = parseInt(msg.peerId.userId.value);
    // Check if the user has configured the bot
    initChatData(chat);
    let lang = chatData[chat].lang;
    if (isCommand(msg.message))
        await handleCommand(msg);
    else if (msg.media)
        await transfer(msg);
    else
        bot.sendMessage(chat, {
            message: strings[lang]["sendMeAFile"]
        }).catch(() => null);
}

function isCommand(message) {
    return message.startsWith("/");
}