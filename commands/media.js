const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const Command = require('../lib/Command');
const Pino = require('pino');
const downloadMedia = require('../lib/downloadMedia');
const {convertWebpToMp4} = require('../lib/sticker');

async function handleStickerToPhotoCommand(sock, message) {
    if (!m.quoted) {
        console.wa('Reply to a sticker with this command.',message);
        return;
    }
    if (!m.quoted?.stickerMessage) {
        console.wa('_This is not a sticker message._\n_Please quote a sticker!!_',message);
        return;
    }
if(m.quoted.stickerMessage.isAnimated!==false){
	console.wa('Reply to a none animated sticker',message);
	return;
}
try{
const mediaBuffer = await  downloadMedia(message);
        // Save the sticker temporarily
        const tempInputPath = path.join(__dirname, 'temp.webp');
        const tempOutputPath = path.join(__dirname, 'temp.jpg');
        fs.writeFileSync(tempInputPath, mediaBuffer);

        // Convert the sticker (WebP) to a JPG using FFmpeg
        await new Promise((resolve, reject) => {
            exec(
                `ffmpeg -i ${tempInputPath} ${tempOutputPath}`,
                (error, stdout, stderr) => {
                    if (error) {
                        console.log(`FFmpeg error: ${error.message}`);
                        reject(error);
                    } else {
                        resolve();
                    }
                }
            );
        });

        // Read the converted JPG image
        const outputBuffer = fs.readFileSync(tempOutputPath);

        // Send the converted photo
        await sock.sendMessage(message.key.remoteJid, {
            image: outputBuffer,
            caption: 'Here is the sticker as a photo!',
        });

        // Clean up temporary files
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(tempOutputPath);
    } catch (error) {
        console.wa('An error occurred while processing the sticker.\nPlease try again later.',message);
        console.log(`Error converting sticker to photo: ${error}`);
    }
}

async function handleStickerToVideoCommand(sock,message){
  if (!m.quoted) {
        console.wa('Reply to a sticker with this command.',message);
        return;
    }
    if (!m.quoted?.stickerMessage) {
        console.wa('_This is not a sticker message._\n_Please quote a sticker!!_',message);
        return;
    }
if(m.quoted.stickerMessage.isAnimated!==true){
	console.wa('Reply to an animated sticker',message);
	return;
}
  try{
    const webPbuffer = await downloadMedia(message);
    const mp4Url = await convertWebpToMp4(webPbuffer);
    await console.waMedia.sendVideo({url:mp4Url},"",message);
    }catch(err){
      await console.wa('An error occured please try again later', message);
      await console.log('error changing sticker to video',err);
    }
}
const mp4command = new Command(
  'mp4',
  'changes sticker to mp4',
  handleStickerToVideoCommand,
  'public',
  'Media',
  false
  );
const command = new Command(
    "photo",
    "Convert a sticker into a photo",
    handleStickerToPhotoCommand,
    'private',
    'Media',
    false
);

module.exports = { command,mp4command };

