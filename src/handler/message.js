import {chatData, handleCommand, initChatData, transfer} from "./index.js";
import { bot } from "../../index.js";
import strings from "../strings.js";

export async function handleMessage(event) {
    let msg = event.message;
    if (msg.peerId.className !== 'PeerUser') return;
    let chat = parseInt(msg.peerId.userId.value);
    initChatData(chat);
    let lang = chatData[chat].lang;
    if (isCommand(msg.message))
        await handleCommand(msg);
    else if (msg.media)
        await transfer(msg);
    else
        bot.sendMessage(chat, {
            message: strings[lang].sendMeAFile
        }).catch(() => null);
}

function isCommand(message) {
    return message.startsWith("/");
}