const { isLinkDetectionEnabled } = require('./antilink');
const { incrementWarning, resetWarning, getWarningCount } = require('./libtest3');

const setupLinkDetection = (sock) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const message of messages) {
            const groupJid = message.key.remoteJid;

            // Ignore non-group messages or bot's own messages
            if (!groupJid.endsWith('@g.us') || message.key.fromMe) continue;

            // Check if link detection is enabled for this group
            if (isLinkDetectionEnabled(groupJid)) {
                const msgText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

                // Check for links in the message
                const linkRegex = /(https?:\/\/[^\s]+)/g;
                if (linkRegex.test(msgText)) {
                    console.log(`Detected link in group ${groupJid}: ${msgText}`);

                    // Delete the message
                    await sock.sendMessage(groupJid, { delete: message.key });

                    // Get participant details
                    const participant = message.key.participant || message.participant;
                    const warningCount = incrementWarning(groupJid, participant);

                    // Warn the user
                    await sock.sendMessage(groupJid, {
                        text: `@${participant.split('@')[0]}, links are not allowed here!\nWarning count: ${warningCount}/3`,
                        mentions: [participant],
                    });

                    // Take action based on warning count
                    if (warningCount >= 3) {
                        // Remove the participant
                        await sock.groupParticipantsUpdate(groupJid, [participant], 'remove');
                        await sock.sendMessage(groupJid, {
                            text: `@${participant.split('@')[0]} has been removed for sending links too many times.`,
                            mentions: [participant],
                        });

                        // Reset warnings after removal
                        resetWarning(groupJid, participant);
                    }
                }
            }
        }
    });
};

module.exports = { setupLinkDetection };