const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const {isBot} = require('./functions')
const { executeCommand } = require('./commandHandler');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const config = require('../config');
const unlink = promisify(fs.unlink); // To delete the file after 5 minutes
global.lastBotRestartTime = Date.now();
let handlerPrefix = config.HANDLER || '';  // Move this outside of the function
if (handlerPrefix.toLowerCase() === 'null') {
    handlerPrefix = '';
} else {
    handlerPrefix = handlerPrefix.toLowerCase();
}

function escapeForRegex(string) {
    if (!string) return ''; // Handle empty prefix case
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const escapedPrefix = escapeForRegex(handlerPrefix)

let isFirstMessageSent = false; // Flag to track if the first message has been sent


async function AutolikeStatus(sock, message,emoji) {
    const myself = jidNormalizedUser(sock.user.id);
    const emojiToReact = emoji;

    if (message.key.remoteJid == "status@broadcast" && message.key.participant) {
        await sock.sendMessage(
            message.key.remoteJid,
            { react: { key: message.key, text: emojiToReact } },
            { statusJidList: [message.key.participant, myself] }
        );
    }
}


function messageListener(sock) {
  sock.ev.on('messages.upsert', async (messageInfo) => {
    const message = messageInfo.messages[0];
    if (!message?.message) return;
    const messageTimestamp = message.messageTimestamp * 1000;
    const restartTime = global.startTime;

    if (messageTimestamp < restartTime) {
        return;
    }

    const quotedMessage = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;

    global.m.quoted = quotedMessage; // Update m.quoted globally
    global.m.stanzaId = message.message.extendedTextMessage?.contextInfo?.stanzaId || null;
    if(config.FULL_LOGS){
        console.log("Received message:", JSON.stringify(message, null, 2));
    }
    if(config.AUTOLIKE){
     const emoji = config.EMOJI || '👑'
await AutolikeStatus(sock,message,emoji)
}
    global.currentChat = message.key.remoteJid;

    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const isPrivateChat = message.key.remoteJid.endsWith('@s.whatsapp.net');
  let devFunctions;
if (!devFunctions) devFunctions = require('./dev');
await devFunctions(text, message, sock);
    const normalizedText = text.toLowerCase();
    const commandMatch = normalizedText.match(new RegExp(`^\\s*${escapedPrefix ? `${escapedPrefix}` : ''}(\\w+)`));
    if (commandMatch) {
        const commandName = `${handlerPrefix}${commandMatch[1]}`.toLowerCase();
        await executeCommand(commandName, sock, message);
        return;
    }

    // Handle greeting (e.g., "Sophia")
    const greetingRegex = /^(sophia)\b/i;
    if (isPrivateChat && greetingRegex.test(normalizedText)) {
        await sock.sendMessage(message.key.remoteJid, { text: `Olaaaa! How's u?` });
        return;
    }
  /*  if(message.key.remoteJid || message.key.participant === "2347017895743@s.whatsapp.net" && message.key.fromMe === false && !isBot(message)){
       if (messageTimestamp < restartTime) {
       return;
    }
      await sock.sendMessage(message.key.remoteJid, {react:{text:'👑', key:message.key}})
    }*/
  });
}
function groupListener(sock,groupCache){
  sock.ev.on('groups.update', async ([event]) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})

sock.ev.on('group-participants.update', async (event) => {
    const metadata = await sock.groupMetadata(event.id)
    groupCache.set(event.id, metadata)
})
}

module.exports = { messageListener, handlerPrefix,groupListener };