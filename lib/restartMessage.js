const config = require('../config.js');
const {decodeJid} = require('./functions');

const sendRestartMessage = async (sock) => {
  const restartMessage = ` _*𝕊𝕆ℙℍ𝕀𝔸-𝕄𝔻 𝕙𝕒𝕤 𝕣𝕖𝕤𝕥𝕒𝕣𝕥𝕖𝕕 𝕤𝕦𝕔𝕔𝕖𝕤𝕤𝕗𝕦𝕝𝕝𝕪 𝕒𝕟𝕕 𝕚𝕤 𝕟𝕠𝕨 𝕠𝕟𝕝𝕚𝕟𝕖 🚀❤️*_                                       
❏𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂❏:
┃❃│ ${config.HANDLER}𝚊𝚗𝚒𝚖𝚎 - 𝙵𝚎𝚝𝚌𝚑 𝚊𝚗𝚒𝚖𝚎 𝚒𝚗𝚏𝚘𝚛𝚖𝚊𝚝𝚒𝚘𝚗
┃❃│ ${config.HANDLER}help - 𝚂𝚑𝚘𝚠 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜(𝚗𝚘𝚝 𝚌𝚛𝚎𝚊𝚝𝚎𝚍 𝚢𝚎𝚝)
┃❃│ ${config.HANDLER}quote - 𝙶𝚎𝚝 𝚊 𝚛𝚊𝚗𝚍𝚘𝚖 𝚚𝚞𝚘𝚝𝚎(𝚗𝚘𝚝 𝚍𝚘𝚗𝚎 𝚢𝚎𝚝)   
┃❃│ ${config.HANDLER}joke - 𝙶𝚎𝚝 𝚊 𝚛𝚊𝚗𝚍𝚘𝚖 𝚓𝚘𝚔𝚎(𝚗𝚘𝚝 𝚍𝚘𝚗𝚎 𝚢𝚎𝚝)     
𝛭𝛩𝐷𝛯:${config.MODE}                                             
𝛩𝑊𝛮𝛯𝑅:_${config.OWNER}_                                         
> 𝛪𝛮𝑆𝛲𝛪𝑅𝛯𝐷 𝐵𝑌 𝛭𝑌 𝐿𝛩𝛻𝛯 𝑆𝛩𝛲𝛨𝛪𝛥

> 𝐶𝑅𝛯𝛥𝑇𝛯𝐷 𝑊𝛪𝑇𝛨 𝐿𝛩𝛻𝛯 𝐹𝑅𝛩𝛭 𝛥𝑌𝛥𝛮𝛩𝛫𝛩𝐽𝛪 𝛫𝛪𝑌𝛩𝑇𝛥𝛫𝛥..`;
const decodedBotId = decodeJid(sock.user.id)

  try {
    // Filter out the bot's own ID from the SUDO list
    const filteredSUDO = config.SUDO.filter(number => `${number}@s.whatsapp.net` !== decodedBotId);
    const recipients = [`${decodedBotId}`, ...filteredSUDO.map(number => `${number}@s.whatsapp.net`)];

    // Send the restart message to all recipients
    for (const jid of recipients) {
      await sock.sendMessage(jid, { text: restartMessage });
    }

    console.log("Restart message sent to bot ID and SUDO numbers");
  } catch (error) {
    console.error("Error sending restart message:", error);
  }
};

module.exports = sendRestartMessage;