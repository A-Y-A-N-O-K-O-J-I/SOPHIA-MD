const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const Pino = require('pino');
const logger = Pino({level:'error'});
async function downloadMedia(message){
  const participant= message.key.participant;
  const mess = {
    key:{
      id:message.key.id,
      fromMe:message.key.fromMe,
      remoteJid:message.key.remoteJid,
     ...(participant && {participant}),
    },
    message: message.message.extendedTextMessage?.contextInfo?.quotedMessage,
  };
  if(message){
    try{
const buffer = await downloadMediaMessage(
            mess,
            'buffer',
            { }
        );return buffer;
} catch(e){
  console.wa('An error occured while trying to download',message);
  logger.error('error downloading media message', e);
  throw e;
}
}else {
await console.wa('there is no message to download');
     return null;
}
}

/*
async function lol(){const buff = await downloadMedia(message)
await console.waMedia.sendSticker(buff)
}
lol()
*/

module.exports = downloadMedia;
