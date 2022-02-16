import strings from "../strings.js";
import { handleCommand, initChatData, transfer } from "./index.js";
import { bot } from '../../index.js';

export async function handleMessage(msg) {
    let chat = parseInt(msg.peerId.userId.value);
    // console.log(msg);
    initChatData(chat);
    if (isCommand(msg.message))
        handleCommand(msg);
    else if (msg.media)
        transfer(msg)
}

function isCommand(message) {
    return message.startsWith("/");
}