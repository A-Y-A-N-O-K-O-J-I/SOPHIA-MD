const Command = require('../lib/Command'); // Import Command structure

const { isQuotedMessage, getQuotedInfo, replyToQuotedMessage } = require('../lib/quotedMessageHandler');

// Main function to handle the quote responder command
async function handleQuoteResponderCommand(sock, message) {
  console.log("Handling quote responder command with message:", JSON.stringify(message, null, 2));

  try {
    if (isQuotedMessage(message)) {
      const quotedInfo = getQuotedInfo(message);

      if (quotedInfo.type === "text") {
        // Handle quoted text
        const quotedMessageContent = quotedInfo.quotedMessage
          ? quotedInfo.quotedMessage.conversation
          : "No conversation text";
        
        await sock.sendMessage(message.key.remoteJid, { text: `Quoted Message: "${quotedMessageContent}"` });
      } else if (quotedInfo.type === "image") {
        // Handle quoted image
        const imageUrl = quotedInfo.imageDetails.url;
        const caption = `Quoted Image URL: ${imageUrl}`;

        await sock.sendMessage(message.key.remoteJid, {
          text: caption,
          image: { url: imageUrl },
          mimetype: quotedInfo.imageDetails.mimetype,
          jpegThumbnail: quotedInfo.imageDetails.jpegThumbnail
            ? Buffer.from(quotedInfo.imageDetails.jpegThumbnail, 'base64')
            : null
        });
      }
    } else {
      await sock.sendMessage(message.key.remoteJid, { text: "Please quote a message to use this command, baka!" });
    }
  } catch (error) {
    console.error("Error handling quote responder command:", error);
    await sock.sendMessage(message.key.remoteJid, { text: "An error occurred. Please try again later." });
  }
}

const quotedCommand = new Command('quote', 'quotes a message', handleQuoteResponderCommand);

module.exports = {quotedCommand}
