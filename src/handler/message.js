import { handleCommand, initChatData, transfer } from "./index.js";

export async function handleMessage(msg) {
    let chat = parseInt(msg.peerId.userId.value);
    // console.log(msg);
    initChatData(chat);
    if (isCommand(msg.message))
        await handleCommand(msg);
    else if (msg.media)
        await transfer(msg)
}

function isCommand(message) {
    return message.startsWith("/");
}