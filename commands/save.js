const Command = require('../lib/Command');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('baileys');
const { SUDO } = require('../config');// Use the SUDO numbers from the config


async function handleQuotedMedia(sock, message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const key = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
  const participant = message.message?.extendedTextMessage?.contextInfo?.participant;

  if (quoted) {
    try {
      const mediaPath = path.join(__dirname, '../temp');
      if (!fs.existsSync(mediaPath)) fs.mkdirSync(mediaPath);

      let mediaStream;
      let filePath;
      let mimetype;
      let caption = 'Saved!';
      
      await sock.sendMessage(message.key.remoteJid, { react: { text: '⌛', key: message.key } });

      // Check if it's a group status message with nested media
      let mediaMessage = quoted;
      if (quoted?.groupStatusMessageV2?.message) {
        mediaMessage = quoted.groupStatusMessageV2.message;
      }

      // Image
      if (mediaMessage?.imageMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: { imageMessage: mediaMessage.imageMessage },
          },
          'buffer',
          {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        );
        filePath = path.join(mediaPath, `image_${Date.now()}.jpg`);
        mimetype = 'image/jpeg';
        if (mediaMessage?.imageMessage?.caption) {
          caption = mediaMessage.imageMessage.caption;
        }
      }
      // Video
      else if (mediaMessage?.videoMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: { videoMessage: mediaMessage.videoMessage },
          },
          'buffer',
          {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        );
        filePath = path.join(mediaPath, `video_${Date.now()}.mp4`);
        mimetype = 'video/mp4';
        if (mediaMessage?.videoMessage?.caption) {
          caption = mediaMessage.videoMessage.caption;
        }
      }
      // Audio
      else if (mediaMessage?.audioMessage) {
        const isVoice = mediaMessage.audioMessage.ptt;
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: { audioMessage: mediaMessage.audioMessage },
          },
          'buffer',
          {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        );
        
        if (isVoice) {
          filePath = path.join(mediaPath, `voice_${Date.now()}.ogg`);
          mimetype = 'audio/ogg; codecs=opus';
        } else {
          filePath = path.join(mediaPath, `audio_${Date.now()}.mp3`);
          mimetype = 'audio/mpeg';
        }
      }
      // Document
      else if (mediaMessage?.documentMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: { documentMessage: mediaMessage.documentMessage },
          },
          'buffer',
          {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        );
        const fileName = mediaMessage.documentMessage.fileName || `document_${Date.now()}.pdf`;
        filePath = path.join(mediaPath, fileName);
        mimetype = mediaMessage.documentMessage.mimetype || 'application/pdf';
      }
      // Sticker
      else if (mediaMessage?.stickerMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: { stickerMessage: mediaMessage.stickerMessage },
          },
          'buffer',
          {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        );
        filePath = path.join(mediaPath, `sticker_${Date.now()}.webp`);
        mimetype = 'image/webp'; 
      }
      
      if (mediaStream) {
        // Write buffer to file
        fs.writeFileSync(filePath, mediaStream);

        // Get bot's own JID
        const userJid = sock.user.lid.split(":")[0] + "@lid";
        
        // Send based on media type
        if (mimetype === 'image/webp') {
          await sock.sendMessage(userJid, {
            sticker: fs.readFileSync(filePath),
          });
        } else if (mimetype.startsWith('image/')) {
          await sock.sendMessage(userJid, {
            image: fs.readFileSync(filePath),
            caption,
            mimetype,
          });
        } else if (mimetype.startsWith('video/')) {
          await sock.sendMessage(userJid, {
            video: fs.readFileSync(filePath),
            caption,
            mimetype,
          });
        } else if (mimetype.startsWith('audio/')) {
          await sock.sendMessage(userJid, {
            audio: fs.readFileSync(filePath),
            mimetype,
            ptt: mimetype.includes('ogg'), // Set as voice note if it's ogg
          });
        } else if (mimetype.includes('document') || mimetype.includes('pdf')) {
          await sock.sendMessage(userJid, {
            document: fs.readFileSync(filePath),
            mimetype,
            fileName: path.basename(filePath),
          });
        }

        // Add success reaction
        await sock.sendMessage(message.key.remoteJid, { react: { text: '✅', key: message.key } });
        setTimeout(async () => {
          await sock.sendMessage(message.key.remoteJid, { react: { text: '', key: message.key } });
        }, 2000);

        // Clean up the temporary file
        fs.unlinkSync(filePath);
      } else {
        // If no valid media, add error reaction
        await sock.sendMessage(message.key.remoteJid, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(message.key.remoteJid, { text: 'No valid media found in the quoted message!' });
      }
    } catch (error) {
      console.error('Error handling quoted media:', error);
      await sock.sendMessage(message.key.remoteJid, { react: { text: '❌', key: message.key } });
      await sock.sendMessage(message.key.remoteJid, { text: `Failed to process the quoted media: ${error.message}` });
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } else {
    // If no quoted media found, add error reaction
    await sock.sendMessage(message.key.remoteJid, { react: { text: '❌', key: message.key } });
    await sock.sendMessage(message.key.remoteJid, { text: 'Please reply to a media message with .save' });
  }
}

const quotedMediaCommand = new Command('save', 'Send quoted media to SUDO numbers only and add reactions', handleQuotedMedia);
module.exports = {quotedMediaCommand};