const config = require('../config');
const { isQuotedMessage } = require('./quotedMessageHandler');

const commands = new Map();

// Register a command with access level
const registerCommand = (command) => {
    commands.set(command.fullCommand, command);
};

// Execute the command based on mode, access level, and quoted message handling
const executeCommand = async (commandName, sock, message) => {
    const command = commands.get(commandName);

    // Determine the sender
    const sender = message.key.participant || message.key.remoteJid;
    const isFromMe = message.key.fromMe; // Check if the message is sent by the bot

    // Determine access levels
    const isAdmin = config.SUDO.includes(sender.replace('@s.whatsapp.net', ''));
    const isOwner = sender.replace('@s.whatsapp.net', '') === config.OWNER;

    // Initialize variables for command text and quoted message info
    let commandText;
    let quotedMessageInfo = null;

    // Check if the message is a quoted message and extract command text and quoted message info
    if (isQuotedMessage(message)) {
        commandText = message.message.extendedTextMessage.text; // Text from quoted message
        quotedMessageInfo = message.message.extendedTextMessage.contextInfo.quotedMessage.conversation; // Info of quoted message
    } else if (message.message && message.message.conversation) {
        commandText = message.message.conversation; // Text from regular message
    }

    // Ensure we have a valid command and message text
    if (command && commandText) {
        const args = commandText.split(/\s+/).slice(1); // Arguments from the command

        // Access control
        if (isFromMe || isOwner || isAdmin) {
            // Bot itself, owner, and admin have access
            await command.execute(sock, message, args, quotedMessageInfo);
        } else if (config.MODE === 'public' && command.accessLevel === 'public') {
            // Public commands in public mode
            await command.execute(sock, message, args, quotedMessageInfo);
        } else if (config.MODE === 'private' && command.accessLevel !== 'public') {
            // Non-public commands in private mode
            await command.execute(sock, message, args, quotedMessageInfo);
        } 
    }
};

// Export the commands map and functions
module.exports = { registerCommand, executeCommand, commands };