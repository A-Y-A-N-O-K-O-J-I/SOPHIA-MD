const Command = require('../lib/Command'); // Assuming you're using this structure for commands
const fs = require('fs');
const path = require('path');
function getJid(message) {
  const quotedParticipant = message.message.extendedTextMessage?.contextInfo?.participant;
  return quotedParticipant ? quotedParticipant : message.key.remoteJid;
}
// Define the '.pp' command
const ppCommand = new Command(
  "pp",
  'Updates your profile picture with the quoted image.',
  async (sock, message) => {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (quoted?.imageMessage) {
      try {
        const imagepath = await console.downloadImage(quoted,sock)
        const jid = sock.user.id;
        await sock.updateProfilePicture(jid,{url: imagepath});
	await console.removeFile(imagepath);
        await console.wa("> PROFILE PICTURE UPDATED SUCCESSFULLY",message);
      } catch (error) {
        console.log("pp error:", error);
        await console.wa("an error occurred",message);
      }
    } else {
      await console.wa("_Please reply to an image_",message);
    }
  },

  'private', // This is a private command
  'User', // Category for organization
  false // No group restriction
);


async function handleGetPp(sock, message) {
  try {
    const jid = getJid(message);
    const ppUrl = await sock.profilePictureUrl(jid, "image");
    await console.waMedia.sendImage({ url: ppUrl }, `> THIS IS ${jid}'s profile picture`,message);
  } catch (e) {
    // Check if the error is related to "not authorized"
    if (e.message === 'Error: not-authorized') {
      await console.wa(`This user does not have a profile picture.`,message);
    } else {
      console.error('Unexpected error:', e);
    }
  }
}
const getPpCommand = new Command(
  'getpp',
  'get profile picture of a user',
  handleGetPp,
  'private',
  'User',
  false
  );


module.exports = { ppCommand,getPpCommand };
