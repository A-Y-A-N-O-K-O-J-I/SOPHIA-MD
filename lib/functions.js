const axios = require('axios');

const { jidDecode } = require('@whiskeysockets/baileys');
// Decode JID function
const decodeJid = (jid) => {
  if (!jid) return jid;
  if (/:\d+@/gi.test(jid)) {
    const decode = jidDecode(jid) || {};
    return decode.user && decode.server
      ? `${decode.user}@${decode.server}`
      : jid;
  } else {
    return jid;
  }
};

const isInGroup = (message) => {
  return message.key.remoteJid.endsWith("@g.us");
};
const isBot = (message)=> {
  return message.key.id.startsWith('3EB0');
}
const isBotQuoted = (message) => {
  return m.stanzaId.startsWith('3EB0')
}

const parseJid = (text = "") => {
  if (typeof text !== 'string') return []; // Check if text is a string
  const matches = text.match(/@([0-9]{5,16}|0)/g); // Use match instead of matchAll
  return matches ? matches.map((v) => v.replace('@', '') + "@s.whatsapp.net") : [];
};

const parsedJid = (text = "") => {
  if (typeof text !== 'string') return []; // Check if text is a string
  const matches = text.match(/([0-9]{5,16}|0)/g); // Use match instead of matchAll
  return matches ? matches.map((v) => v + "@s.whatsapp.net") : [];
};


// Check if the user is an admin
const isAdmin = async (jid, user, sock) => {
  try {
    const decodedUser = decodeJid(user);
    console.log("Decoded User JID:", decodedUser);

    const groupMetadata = await sock.groupMetadata(jid);
    const groupAdmins = groupMetadata.participants
      .filter((participant) => participant.admin !== null)
      .map((participant) => participant.id);

    return groupAdmins.includes(decodedUser);
  } catch (error) {
    console.error("Error in isAdmin function:", error);
    return false;
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function isValidTikTokURL(url) {
     const regex = /^(https?:\/\/)?(vm\.tiktok\.com|www\.tiktok\.com)\/.+$/;
    return regex.test(url);
}
  function checkURL(url) {
  // Regex for detecting TikTok video links
  const tiktokRegex = /^(https?:\/\/)?(vm\.tiktok\.com|www\.tiktok\.com)\/.+$/;

// Revised YouTube regex
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/;

// Revised Instagram regex
const instagramRegex = /^(https?:\/\/)?(www\.)?(instagram\.com|ig\.com)\/.+$/;
  // Check for TikTok URL
  if (tiktokRegex.test(url)) {
    return 'tiktok';
  }
  
  // Check for YouTube URL
  if (youtubeRegex.test(url)) {
    return 'youtube';
  }
  
  // Check for Facebook URL
  if (facebookRegex.test(url)) {
    return 'facebook';
  }
  if(instagramRegex.test(url)){
    return 'instagram';
  }

  // If none of the above, return unknown
  return 'unknown';
}

const bufferToBase64 = (buffer) => {
    return buffer.toString('base64');
};

const base64ToBuffer = (base64) => {
    return Buffer.from(base64, 'base64');
};

module.exports = { 
  decodeJid,
  isBot,
  isBotQuoted,
  isAdmin, 
  parseJid,
  parsedJid,
  isInGroup,
  delay,
  isValidTikTokURL , 
  base64ToBuffer,
  bufferToBase64,
  checkURL
  
}; 
