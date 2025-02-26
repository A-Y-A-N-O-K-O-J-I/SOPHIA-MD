const config = require('../config');

// In-memory storage for messages
let messageStore = {};

// Function to handle storing incoming messages temporarily
async function storeMessage(message) {
    if (message.key && message.key.id) {
        messageStore[message.key.id] = message;
        console.log(`Stored message with ID: ${message.key.id}`);
    }
}

// Function to handle deleted messages
async function handleDeletedMessages(sock, keys) {
    for (const key of keys) {
        const storedMessage = messageStore[key.id];
        if (storedMessage) {
            const messageContent =
                storedMessage.message?.conversation || 
                storedMessage.message?.extendedTextMessage?.text ||
                'Media message (e.g., image, video, or document)';

            // Message details to send
            const deletedMessageInfo = `*Message Deleted*\n\n*Content:* ${messageContent}\n*From:* ${key.remoteJid}`;

            console.log(deletedMessageInfo);

            for (const sudoNumber of config.SUDO) {
                await sock.sendMessage(`${sudoNumber}@s.whatsapp.net`, {
                    text: deletedMessageInfo,
                    quoted: storedMessage, // Quote the deleted message
                    linkPreview: true,    // Enable link preview for URLs
                });
            }

            // Cleanup: Remove the message from the store
            delete messageStore[key.id];
        }
    }
}

module.exports = {
    storeMessage,
    handleDeletedMessages,
};
