const sophia = require('sophia');
const downloadMedia = require('../lib/downloadMedia');
const react = require('react');

sophia({
  name: 'vv',
  description: 'For unlocking view once images,video and voice note',
  execute: async function (sock, message) {
    try {
      await react('p', message);
      const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quoted || quoted.conversation) {
        await react('p', message);
        await delay(2000);
        await react('e', message);
        await console.wa('Please reply to a view once message', message);
        return;
      }

      const media = quoted?.viewOnceMessageV2?.message || quoted;
     
      const content = media?.imageMessage || 
                     media?.videoMessage || 
                     media?.audioMessage ||
                     quoted?.viewOnceMessageV2Extension?.message?.audioMessage;
      
      if (!content?.viewOnce && !quoted.viewOnceMessageV2 && !quoted.viewOnceMessageV2Extension) {
        await react('e', message);
        await console.wa('This is not a view once message', message);
        return;
      }

      const buffer = await downloadMedia(message);
      
      let mediaType = 'image';
      let options = {};
      
      if (content.mimetype?.includes('video')) {
        mediaType = 'video';
        if (content.caption) options.caption = content.caption;
      } else if (content.mimetype?.includes('audio')) {
        mediaType = 'audio';
        options.ptt = content.ptt || false;
        options.mimetype = content.mimetype;
      } else {
        if (content.caption) options.caption = content.caption;
      }

      
      const destination = message.key.fromMe ? sock.user.id : message.key.remoteJid;

      await sock.sendMessage(destination, {
        [mediaType]: buffer,
        ...options
      });
      await react('c', message);

    } catch (error) {
      await react('e', message);
      await console.wa(`Error processing view once message: ${error.message}`, message);
    }
  }
});