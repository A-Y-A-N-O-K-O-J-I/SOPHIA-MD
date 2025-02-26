const Command = require('../lib/Command');
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
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

      // Image
      if (quoted?.imageMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: quoted,
          },
          sock
        );
        filePath = path.join(mediaPath, `image_${Date.now()}.jpg`);
        mimetype = 'image/jpeg';
        if (quoted?.imageMessage?.caption) {
          caption = quoted.imageMessage.caption;
        }
      }
      // Audio
      else if (quoted?.audioMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: quoted,
          },
          sock
        );
        filePath = path.join(mediaPath, `audio_${Date.now()}.mp3`);
        mimetype = 'audio/mpeg';
      }
      // Video
      else if (quoted?.videoMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: quoted,
          },
          sock
        );
        filePath = path.join(mediaPath, `video_${Date.now()}.mp4`);
        mimetype = 'video/mp4';
        if (quoted?.videoMessage?.caption) {
          caption = quoted.videoMessage.caption;
        }
      }
      // Document
      else if (quoted?.documentMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: quoted,
          },
          sock
        );
        filePath = path.join(mediaPath, `document_${Date.now()}.pdf`);
        mimetype = 'application/pdf'; // Adjust if it's another type of document
      }
      // Voice Note
      else if (quoted?.audioMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: quoted,
          },
          sock
        );
        filePath = path.join(mediaPath, `voice_${Date.now()}.ogg`);
        mimetype = 'audio/ogg;codecs=opus';
      }
      // Sticker
      else if (quoted?.stickerMessage) {
        mediaStream = await downloadMediaMessage(
          {
            key: { id: key, remoteJid: message.key.remoteJid, participant },
            message: quoted,
          },
          sock
        );
        filePath = path.join(mediaPath, `sticker_${Date.now()}.webp`);
        mimetype = 'image/webp'; 
      }
      
      if (mediaStream) {
        const writeStream = fs.createWriteStream(filePath);

        // Pipe the stream to a file
        await new Promise((resolve, reject) => {
          mediaStream.pipe(writeStream);
          mediaStream.on('end', resolve);
          mediaStream.on('error', reject);
        });

        // Send the downloaded media to SUDO numbers only
        // For sticker media, send it as a sticker type
  if (mimetype === 'image/webp') {
      await sock.sendMessage(sock.user.id, {
        sticker: fs.readFileSync(filePath), // Send the media as sticker
        quoted: message, // Add quoted message for context if needed
      });
    
  } else {
    // Handle other media types (audio, image, video, etc.
      await sock.sendMessage(sock.user.id, {
        [mimetype.split('/')[0]]: { url: filePath },
        caption,
        mimetype,
        quoted: message, // Add quoted message for context if needed
      });
  }

        // Add success reaction
        await sock.sendMessage(message.key.remoteJid, { react: { text: '✅', key: message.key } });
        await sock.sendMessage(message.key.remoteJid, { react: { text: null, key: message.key } });

        // Clean up the temporary file
        fs.unlinkSync(filePath);
      } else {
        // If no valid media, add error reaction
        await sock.sendMessage(message.key.remoteJid, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(message.key.remoteJid, { react: { text: null, key: message.key } });
        await sock.sendMessage(message.key.remoteJid, { text: 'No valid media found in the quoted message!' });
      }
    } catch (error) {
      console.error('Error handling quoted media:', error);
      await sock.sendMessage(message.key.remoteJid, { text: 'Failed to process the quoted media.' });
      if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
      }
       
    }
  } else {
    // If no quoted media found, add error reaction
    await sock.sendMessage(message.key.remoteJid, { react: { text: '❌', key: message.key } });
    await sock.sendMessage(message.key.remoteJid, { text: 'No quoted media found!' });
  }
}



const quotedMediaCommand = new Command('save', 'Send quoted media to SUDO numbers only and add reactions', handleQuotedMedia);
module.exports = {quotedMediaCommand};
