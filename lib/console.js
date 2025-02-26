

global.global.console.wa = async (mess,message) => {
  if (message.key.remoteJid) {
    try {
      // Send the message and capture the response to get the message object with a key
      const response = await sock.sendMessage(message.key.remoteJid, { text: mess },{quoted:message});
      
      // Log the sent message and the response key
      console.log(`Message sent to ${message.key.remoteJid}: ${mess}`);
      
      // Return the response so you can access the key
      return response; 
    } catch (error) {
      console.error('Failed to send message via console.wa:', error.message);
    }
  } else {
    console.error('No active chat to send message.');
  }
};

global.console.waMedia = {
sendSticker: async (stickerPath,nik) => {
    if (nik.key.remoteJid) {
      try {
        await sock.sendMessage(nik.key.remoteJid, { sticker: stickerPath },{quoted:nik});
      } catch (error) {
        console.error('Failed to send image:', error.message);
      }
    } else {
      console.error('No active chat to send image.');
    }
  },
  sendImage: async (imageBuffer, caption, m) => {
    if (m.key.remoteJid) {
      try {
        await sock.sendMessage(m.key.remoteJid, { image: imageBuffer , caption:caption });
      } catch (error) {
        console.error('Failed to send image:', error.message);
      }
    } else {
      console.error('No active chat to send image.');
    }
  },

  sendVideo: async (videoBuffer, cap,m) => {
    if (m.key.remoteJid) {
      try {
        await sock.sendMessage(m.key.remoteJid, { video: videoBuffer, caption:cap });
      } catch (error) {
        console.error('Failed to send video:', error.message);
      }
    } else {
      console.error('No active chat to send video.');
    }
  },

  sendDocument: async (documentPath, caption = '') => {
    if (global.currentChat) {
      try {
        await sock.sendMessage(global.currentChat, { document: { url: documentPath }, caption });
        console.log(`Document sent to ${global.currentChat}`);
      } catch (error) {
        console.error('Failed to send document:', error.message);
      }
    } else {
      console.error('No active chat to send document.');
    }
  }
};
global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
global.console.waReact = async (reaction, customKey) => {
  const key = customKey || message.key;
  if (global.currentChat && key) {
    try {
      await sock.sendMessage(global.currentChat, {
        react: { text: reaction, key: key },
      });
    } catch (error) {
      console.error('Failed to send reaction via console.waReact:', error.message);
    }
  } else {
    console.error('No active chat or key to react to');
  }
};

global.console.mention  = async (text,arrays,message) => {
  if(message.key.remoteJid){
    try{
  await sock.sendMessage(message.key.remoteJid, {text:text, mentions:[arrays]})
}
catch(e){
  console.error('error: ',e)
}
} else {
  console.error('No mentions found')
}
};

global.m = {
  quoted: null, // Default value for quoted
  stanzaId:null,
};