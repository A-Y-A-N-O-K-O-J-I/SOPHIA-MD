// Check if the message is a quoted message
function isQuotedMessage(message) {
  return (
    message.message &&
    (message.message.extendedTextMessage?.contextInfo?.stanzaId || message.message.quotedMessage?.imageMessage?.contextInfo?.stanzaId)
  );
}

// Get the entire context info of the quoted message
function getQuotedInfo(message) {
  if (isQuotedMessage(message)) {
    // Extract context information based on the message type (text or image)
    const contextInfo = message.message.extendedTextMessage
      ? message.message.extendedTextMessage.contextInfo
      : message.message.quotedMessage?.imageMessage?.contextInfo;

    console.log("Quoted Message Context:", contextInfo);

    // Return the quoted message and additional details
    return {
      quotedMessage: contextInfo?.quotedMessage,  // The quoted content (text or image)
      type: message.message.extendedTextMessage ? "text" : "image",  // Whether it's a text or image
      imageDetails: message.message.quotedMessage?.imageMessage || {},  // If it's an image, return its details
    };
  }
  return {};  // Return empty if no quoted message
}

// Reply to the quoted message
async function replyToQuotedMessage(sock, message, replyText) {
  try {
    if (isQuotedMessage(message)) {
      const quotedId = message.message.extendedTextMessage.contextInfo.stanzaId;
      const quotedRemoteJid = message.key.remoteJid;
      const participant = message.message.extendedTextMessage.contextInfo.participant || message.key.participant;

      // Create the context info for the quoted message
      const contextInfo = {
        stanzaId: quotedId,
        participant: participant,
        quotedMessage: message.message.extendedTextMessage.contextInfo.quotedMessage,
      };

      await sock.sendMessage(quotedRemoteJid, { text: replyText }, { quoted: { key: { id: quotedId, participant }, contextInfo } });
    } else {
      await sock.sendMessage(message.key.remoteJid, { text: "No quoted message found." });
    }
  } catch (error) {
    console.error("Error replying to quoted message:", error);
    await sock.sendMessage(message.key.remoteJid, { text: "An error occurred while replying to the quoted message." });
  }
}

// Export the functions for use in other modules
module.exports = {
  isQuotedMessage,
  getQuotedInfo,
  replyToQuotedMessage,
};
