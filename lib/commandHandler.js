const fs = require('fs');
const config = require('../config');
const { isQuotedMessage } = require('./quotedMessageHandler');
const commands = new Map();

const registerCommand = (command) => {
    commands.set(command.fullCommand, command);
};

// Function to get SUDO users from JSON
const getSudoList = () => {
const path = require("path");
let dbPath = path.join(__dirname,".","database","sudo.json")
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading sudo.json:', error);
    }
    return []; // Return empty array if the file doesn't exist or is corrupted
};

const isAdmin = (sender) => {
    const number = sender.replace('@s.whatsapp.net', '');
    const sudoList = getSudoList();
    return config.SUDO.includes(number) || sudoList.includes(number);
};

const executeCommand = async (commandName, sock, message) => {
    const command = commands.get(commandName);
    const sender = message.key.participant || message.key.remoteJid;
    const isFromMe = message.key.fromMe;

    // Prevent execution for specific message IDs
    if (message.key.id.startsWith('3EB0') || message.key.id.startsWith('SUHAILMD')) {
        return;
    }

    // Determine access levels
    const isOwner = sender.replace('@s.whatsapp.net', '') === config.OWNER;
    const adminCheck = isAdmin(sender);

    // Check if the command is group-only
    const isGroup = message.key.remoteJid.endsWith('@g.us');
    if (command?.isGroupOnly && !isGroup) {
        return;
    }

    // Initialize command text and quoted message info
    let commandText;
    let quotedMessageInfo = null;

    if (isQuotedMessage(message)) {
        commandText = message.message.extendedTextMessage.text;
        quotedMessageInfo = message.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
    } else if (message.message?.conversation || message.message.extendedTextMessage.text) {
        commandText = message.message.conversation || message.message.extendedTextMessage.text;
    }

    if (command && commandText) {
        const args = commandText.split(/\s+/).slice(1);

        // Private mode logic (restrict commands for non-owner/sudo users)
        if (config.MODE === 'private') {
            if (isFromMe || isOwner || adminCheck) {
                await command.execute(sock, message, args, quotedMessageInfo);
            }
        } else if (config.MODE === 'public') {
            // Check if command is private and sender is authorized
            if (command.accessLevel === 'private' && (isOwner || adminCheck)) {
                await command.execute(sock, message, args, quotedMessageInfo);
            } 
            // In public mode, execute public commands for all users
            else if (command.accessLevel === 'public') {
                await command.execute(sock, message, args, quotedMessageInfo);
            } else {
                // For private commands, inform that it is for the owner or sudo users only
                if (!isFromMe && !isOwner && !adminCheck) {
                    await sock.sendMessage(message.key.remoteJid, {
                        text: '_⚠️ This command is for the bot owner or sudo users only._',
                    });
                }
            }
        }
    }
};

module.exports = { registerCommand, executeCommand, commands,getSudoList };