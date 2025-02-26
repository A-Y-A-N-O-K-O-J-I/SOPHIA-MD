const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

global.console.downloadImage = async (mediaMessage, sock) => {
  if (mediaMessage?.imageMessage) {
    try {
      const stream = await downloadMediaMessage({
        key: mediaMessage.key,
        message: mediaMessage,
      }, sock);

      const filePath = path.join(__dirname, '../temp', `image_${Date.now()}.jpg`);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      return filePath; // Returns the path to the downloaded image
    } catch (error) {
      console.error('Error downloading image:', error);
      console.wa("Failed to download image.");
    }
  } else {
    console.wa("No image media found.");
  }
};

global.console.downloadVideo = async (mediaMessage, sock) => {
  if (mediaMessage?.videoMessage) {
    try {
      const stream = await downloadMediaMessage({
        key: mediaMessage.key,
        message: mediaMessage,
      }, sock);

      const filePath = path.join(__dirname, '../temp', `video_${Date.now()}.mp4`);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      return filePath; // Returns the path to the downloaded video
    } catch (error) {
      console.error('Error downloading video:', error);
      console.wa("Failed to download video.");
    }
  } else {
    console.wa("No video media found.");
  }
};

global.console.downloadAudio = async (mediaMessage, sock) => {
  if (mediaMessage?.audioMessage) {
    try {
      const stream = await downloadMediaMessage({
        key: mediaMessage.key,
        message: mediaMessage,
      }, sock);

      const filePath = path.join(__dirname, '../temp', `audio_${Date.now()}.mp3`);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      return filePath; // Returns the path to the downloaded audio
    } catch (error) {
      console.error('Error downloading audio:', error);
      console.wa("Failed to download audio.");
    }
  } else {
    console.wa("No audio media found.");
  }
};

global.console.downloadDocument = async (mediaMessage, sock) => {
  if (mediaMessage?.documentMessage) {
    try {
      const stream = await downloadMediaMessage({
        key: mediaMessage.key,
        message: mediaMessage,
      }, sock);

      const filePath = path.join(__dirname, '../temp', `document_${Date.now()}.pdf`);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      return filePath; // Returns the path to the downloaded document
    } catch (error) {
      console.error('Error downloading document:', error);
      console.wa("Failed to download document.");
    }
  } else {
    console.wa("No document media found.");
  }
};

global.console.downloadSticker = async (mediaMessage, sock) => {
  if (mediaMessage?.stickerMessage) {
    try {
      const stream = await downloadMediaMessage(
        {
          key: mediaMessage.key,
          message: mediaMessage,
        },
        sock
      );

      const filePath = path.join(__dirname, '../temp', `sticker_${Date.now()}.webp`);
      const writeStream = fs.createWriteStream(filePath);

      await new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      return filePath; // Returns the path to the downloaded document
    } catch (error) {
      console.error('Error downloading document:', error);
      console.wa("Failed to download document.");
    }
  } else {
    console.wa("No sticker found");
  }
};

// Function to remove file after sending it
global.console.removeFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error removing file:', err);
    } else {
      console.log('File removed successfully:', filePath);
    }
  });
};
