// lib/stickerHelper.js
const fs = require('fs');
const path = require('path');

const STICKER_CMD_DB = path.join(__dirname, 'database/sticker-commands.json');

// Read sticker commands from database
function getStickerCommands() {
    if (!fs.existsSync(STICKER_CMD_DB)) {
        return [];
    }
    try {
        const data = fs.readFileSync(STICKER_CMD_DB, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading sticker commands:', error);
        return [];
    }
}

// Find sticker command by fileSha256
function findStickerCommand(fileSha256) {
    const commands = getStickerCommands();
    return commands.find(cmd => cmd.fileSha256 === fileSha256);
}

function checkStickerCommand(message) {
    if (!message.message?.stickerMessage) return null;
    
    const fileSha256Raw = message.message.stickerMessage.fileSha256;
    const fileSha256 = Buffer.from(fileSha256Raw).toString('base64');
    const stickerCmd = findStickerCommand(fileSha256);
    
    return stickerCmd ? stickerCmd.command : null;
}

module.exports = { checkStickerCommand, getStickerCommands, findStickerCommand };