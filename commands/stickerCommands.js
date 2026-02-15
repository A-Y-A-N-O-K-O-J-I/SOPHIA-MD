const Command = require('../lib/Command');
const fs = require('fs');
const path = require('path');

const STICKER_CMD_DB = path.join(__dirname, '../lib/database/sticker-commands.json');

// Initialize database if it doesn't exist
function initDB() {
    if (!fs.existsSync(STICKER_CMD_DB)) {
        fs.writeFileSync(STICKER_CMD_DB, JSON.stringify([], null, 2));
    }
}

// Read sticker commands from database
function getStickerCommands() {
    initDB();
    try {
        const data = fs.readFileSync(STICKER_CMD_DB, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading sticker commands:', error);
        return [];
    }
}

// Save sticker commands to database
function saveStickerCommands(commands) {
    try {
        fs.writeFileSync(STICKER_CMD_DB, JSON.stringify(commands, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving sticker commands:', error);
        return false;
    }
}

// Find sticker command by fileSha256
function findStickerCommand(fileSha256) {
    const commands = getStickerCommands();
    return commands.find(cmd => cmd.fileSha256 === fileSha256);
}

// SET CMD - Add a new sticker command
async function handleSetCmd(sock, message, args) {
    const commandName = args[0];
    
    if (!commandName) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ *Usage:* .setcmd <command_name>\n\n*Example:* Reply to a sticker with .setcmd tagall`
        });
    }

    // Check if message is a reply to a sticker
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMessage || !quotedMessage.stickerMessage) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ Please reply to a sticker with the command!`
        });
    }

    const fileSha256Raw = quotedMessage.stickerMessage.fileSha256;
    
    // Convert Uint8Array/Buffer to base64 string
    const fileSha256 = Buffer.from(fileSha256Raw).toString('base64');
    
    console.log("🔍 Converted fileSha256:", fileSha256);

    // Check if sticker already has a command
    const existing = findStickerCommand(fileSha256);
    if (existing) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ This sticker already has a command: *${existing.command}*\n\nUse .upcmd to update it.`
        });
    }

    // Add new sticker command
    const commands = getStickerCommands();
    commands.push({
        fileSha256,
        command: commandName.toLowerCase(),
        createdBy: message.key.participant || message.key.remoteJid,
        createdAt: new Date().toISOString()
    });

    if (saveStickerCommands(commands)) {
        await sock.sendMessage(message.key.remoteJid, {
            text: `✅ *Sticker Command Set!*\n\n📌 Command: *${commandName}*\n🔖 This sticker will now trigger: *.${commandName}*`
        });
    } else {
        await sock.sendMessage(message.key.remoteJid, {
            text: `❌ Failed to save sticker command. Please try again.`
        });
    }
}

// GET CMD - View all sticker commands or check a specific sticker
async function handleGetCmd(sock, message, args) {
    const commands = getStickerCommands();

    // Check if replying to a sticker to get its command
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (quotedMessage && quotedMessage.stickerMessage) {
        const fileSha256Raw = quotedMessage.stickerMessage.fileSha256;
        const fileSha256 = Buffer.from(fileSha256Raw).toString('base64');
        const stickerCmd = findStickerCommand(fileSha256);
        
        if (stickerCmd) {
            await sock.sendMessage(message.key.remoteJid, {
                text: `🔖 *Sticker Command*\n\n📌 Command: *.${stickerCmd.command}*\n📅 Created: ${new Date(stickerCmd.createdAt).toLocaleString()}`
            });
        } else {
            await sock.sendMessage(message.key.remoteJid, {
                text: `❌ This sticker doesn't have a command assigned.`
            });
        }
        return;
    }

    // Show all sticker commands
    if (commands.length === 0) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `📋 *No sticker commands yet!*\n\nUse .setcmd to create one.`
        });
    }

    let text = `📋 *Sticker Commands* (${commands.length})\n\n`;
    commands.forEach((cmd, index) => {
        text += `${index + 1}. *.${cmd.command}*\n`;
        text += `   📅 ${new Date(cmd.createdAt).toLocaleDateString()}\n\n`;
    });
    text += `_Reply to a sticker with .getcmd to see its command_`;

    await sock.sendMessage(message.key.remoteJid, { text });
}

// UPDATE CMD - Update an existing sticker command
async function handleUpCmd(sock, message, args) {
    const newCommandName = args[0];
    
    if (!newCommandName) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ *Usage:* .upcmd <new_command_name>\n\n*Example:* Reply to a sticker with .upcmd vv`
        });
    }

    // Check if message is a reply to a sticker
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMessage || !quotedMessage.stickerMessage) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ Please reply to a sticker with the command!`
        });
    }

    const fileSha256Raw = quotedMessage.stickerMessage.fileSha256;
    const fileSha256 = Buffer.from(fileSha256Raw).toString('base64');
    
    const commands = getStickerCommands();
    const index = commands.findIndex(cmd => cmd.fileSha256 === fileSha256);

    if (index === -1) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ This sticker doesn't have a command.\n\nUse .setcmd to create one.`
        });
    }

    const oldCommand = commands[index].command;
    commands[index].command = newCommandName.toLowerCase();
    commands[index].updatedAt = new Date().toISOString();
    commands[index].updatedBy = message.key.participant || message.key.remoteJid;

    if (saveStickerCommands(commands)) {
        await sock.sendMessage(message.key.remoteJid, {
            text: `✅ *Sticker Command Updated!*\n\n📌 Old: *.${oldCommand}*\n📌 New: *.${newCommandName}*`
        });
    } else {
        await sock.sendMessage(message.key.remoteJid, {
            text: `❌ Failed to update sticker command. Please try again.`
        });
    }
}

// DELETE CMD - Remove a sticker command
async function handleDelCmd(sock, message, args) {
    // Check if message is a reply to a sticker
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMessage || !quotedMessage.stickerMessage) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ Please reply to a sticker with .delcmd to remove its command!`
        });
    }

    const fileSha256Raw = quotedMessage.stickerMessage.fileSha256;
    const fileSha256 = Buffer.from(fileSha256Raw).toString('base64');
    
    const commands = getStickerCommands();
    const index = commands.findIndex(cmd => cmd.fileSha256 === fileSha256);

    if (index === -1) {
        return await sock.sendMessage(message.key.remoteJid, {
            text: `❌ This sticker doesn't have a command.`
        });
    }

    const deletedCommand = commands[index].command;
    commands.splice(index, 1);

    if (saveStickerCommands(commands)) {
        await sock.sendMessage(message.key.remoteJid, {
            text: `✅ *Sticker Command Deleted!*\n\n📌 Removed: *.${deletedCommand}*`
        });
    } else {
        await sock.sendMessage(message.key.remoteJid, {
            text: `❌ Failed to delete sticker command. Please try again.`
        });
    }
}

// Check if a sticker should trigger a command (to be used in listener)
function checkStickerCommand(message) {
    if (!message.message?.stickerMessage) return null;
    
    const fileSha256Raw = message.message.stickerMessage.fileSha256;
    const fileSha256 = Buffer.from(fileSha256Raw).toString('base64');
    const stickerCmd = findStickerCommand(fileSha256);
    
    return stickerCmd ? stickerCmd.command : null;
}

// Create Command instances
const setcmdCommand = new Command(
    'setcmd',
    'Assign a command to a sticker (reply to sticker)',
    handleSetCmd,
    'public',
    'Sticker',
    false
);

const getcmdCommand = new Command(
    'getcmd',
    'View all sticker commands or check a specific sticker',
    handleGetCmd,
    'public',
    'Sticker',
    false
);

const upcmdCommand = new Command(
    'upcmd',
    'Update a sticker command (reply to sticker)',
    handleUpCmd,
    'public',
    'Sticker',
    false
);

const delcmdCommand = new Command(
    'delcmd',
    'Delete a sticker command (reply to sticker)',
    handleDelCmd,
    'public',
    'Sticker',
    false
);

module.exports = {
    setcmdCommand,
    getcmdCommand,
    upcmdCommand,
    delcmdCommand,
};