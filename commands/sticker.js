const Command = require('../lib/Command');
const { createImgSticker,createVidSticker,writeExifWebp } = require('../lib/sticker');
const downloadMedia = require('../lib/downloadMedia');
const fs = require('fs').promises;
const { STICKER_PACKNAME } = require('../config')
const path = require('path');
const filePath = path.join(__dirname,"..","temp",`${Date.now()}.jpg`);
const metaData = STICKER_PACKNAME ||'K.AYANOKOJI';
const x = '❌';
const glass = '⏳';
const done = '✅';
const none = null;
async function handleStickerCommand(sock, message){
  const key = message.key;
  const image = m.quoted?.imageMessage;
  const video = m.quoted?.videoMessage;
  if(image){
  try{
  await console.waReact(glass,key);
    const buffer = await downloadMedia(message);
    await fs.writeFile(filePath,buffer)
    const webPBuffer = await createImgSticker(filePath,metaData);
   await console.waMedia.sendSticker(webPBuffer,message);
   await console.waReact(done,key);
   await delay(5000);
   await fs.unlink(filePath)
   await console.waReact(none,key);
  }catch(err){
    console.error('error handling sticker',err)
  }
  }
else if(video){
   try{
     await console.waReact(glass,key);
     const buffer1 = await downloadMedia(message);
     const webPbuffer2 = await createVidSticker(buffer1,metaData);
    await console.waMedia.sendSticker(webPbuffer2,message);
     await console.waReact(done,key);
     
   } catch(err){
    console.error('error changing video sticker', err);
    await console.waReact(x,key);
    console.wa('An error occured Try again later',message);
    await delay(5000)
    await console.waReact(none,key);
   }
  } else{
    console.wa('please quote an image or a video',message);
  }
}
const handleTakeStickerCommand = async(sock,message,args)=> {
  if(m.quoted?.stickerMessage){
    try{
      const metaData = args[0] ||STICKER_PACKNAME;
      const stickerBuffer = await downloadMedia(message);
      const modifiedStickerBuffer = await writeExifWebp(stickerBuffer,metaData);
     await console.waMedia.sendSticker(modifiedStickerBuffer,message)
    }catch(er){
      console.error("error modifying sticker",er);
      console.wa("An error occurred",message);
    }
  } else{
    console.wa('_Reply to a sticker_',message);
  }
};
const photoAndStickerCommand = new Command(
  'sticker',
  'changes media to sticker',
  handleStickerCommand,
  'public',
  'Media',
  false
   );
   const takeStickerCommand = new Command(
     'take',
     'for changing meta data of sticker(stealing sticker)',
     handleTakeStickerCommand,
     'public',
     'Media',
     false
     );
   module.exports = { photoAndStickerCommand,takeStickerCommand }
