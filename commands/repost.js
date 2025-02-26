const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const readline = require('readline');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { decodeJid } = require('../lib/functions');
const Command = require('../lib/Command');
const config = require('../config.js'); 

async function handleStatusCommand(sock, message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const key = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
  const participant = message.message?.extendedTextMessage?.contextInfo?.participant;

  if (quoted) {
    try {
      const mediaPath = path.join(__dirname, '../temp');
      if (!fs.existsSync(mediaPath)) fs.mkdirSync(mediaPath);

      let mediaStream, filePath, mimetype, caption;

      mediaStream = await downloadMediaMessage(
        {
          key: { id: key, remoteJid: message.key.remoteJid, participant },
          message: quoted,
        },
        sock
      );

      if (quoted?.imageMessage) {
        filePath = path.join(mediaPath, `image_${Date.now()}.jpg`);
        mimetype = 'image/jpeg';
        caption = quoted.imageMessage.caption || null;
      } else if (quoted?.videoMessage) {
        filePath = path.join(mediaPath, `video_${Date.now()}.mp4`);
        mimetype = 'video/mp4';
        caption = quoted.videoMessage.caption || null;
      } else {
        await sock.sendMessage(message.key.remoteJid, { text: '*No valid media to post!*' });
        return;
      }

      const writeStream = fs.createWriteStream(filePath);
      await new Promise((resolve, reject) => {
        mediaStream.pipe(writeStream);
        mediaStream.on('end', resolve);
        mediaStream.on('error', reject);
      });

      if (mimetype === 'video/mp4') {
        const trimmedFilePath = path.join(mediaPath, `trimmed_${Date.now()}.mp4`);

        await new Promise((resolve, reject) => {
          ffmpeg(filePath)
            .ffprobe((err, metadata) => {
              if (err) return reject(err);
              const duration = metadata.format.duration;

              if (duration > 60) {
                ffmpeg(filePath)
                  .setStartTime(0)
                  .setDuration(60)
                  .output(trimmedFilePath)
                  .on('end', () => {
                    fs.unlinkSync(filePath); 
                    filePath = trimmedFilePath; 
                    resolve();
                  })
                  .on('error', reject)
                  .run();
              } else {
                resolve();
              }
            });
        });
      }

      const statusJidFile = path.join(__dirname, '../lib/database/status_viewers.json'); 
      if (!fs.existsSync(statusJidFile)) {
  // If statusJidFile doesn't exist, attempt to delete filePath if it exists
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);  // Delete the file if it exists
  } else {
    return;
  }
  
  // Inform the user that status_viewers.json is not found
  await sock.sendMessage(
    message.key.remoteJid,
    { text: `status_viewers.json file not found.` }
  );
  return;
}

      const statusJidList = JSON.parse(fs.readFileSync(statusJidFile));

      // Add the bot's JID to the list
      const botJid = decodeJid(sock.user.id);
      const updatedStatusJidList = [botJid, ...statusJidList];
	// console.log(updatedStatusJidList);

      // === Send Status Update ===
      await console.waReact('⏳', message.key);
	await delay(2000);
	    await sock.sendMessage(
        'status@broadcast',
        {
          [mimetype.split('/')[0]]: { url: filePath }, // Detect 'image' or 'video'
          caption,
        },
        {
          statusJidList: updatedStatusJidList, // Make visible to specific users
        }
      );

await console.waReact('✅', message.key);
await delay(10000);
await console.waReact(null, message.key);
      // Clean up
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error handling status command:', error);
      await console.waReact('❌',message.key);
      await sock.sendMessage(message.key.remoteJid, { text: '☠️ Failed to process the quoted media.' });
      await delay(5000);
      await console.waReact(null,message.key);
    }
  } else {
    await sock.sendMessage(message.key.remoteJid, { text: '*Please quote an image or video to post on status.*' });
  }
}

const statusJidFile = path.join(__dirname, '../lib/database/status_viewers.json');

// Utility function to read the JSON file
function getStatusJidList() {
  if (fs.existsSync(statusJidFile)) {
    return JSON.parse(fs.readFileSync(statusJidFile));
  }
  return [];
}

// Utility function to write to the JSON file
function saveStatusJidList(statusJidList) {
  fs.writeFileSync(statusJidFile, JSON.stringify(statusJidList, null, 2));
}

// Handler for add/remove commands
async function handleAddOrRemoveCommand(sock, message, action) {
  // Restriction for groups and non-fromMe messages
  if (message.key.remoteJid.includes('@g.us') || message.key.fromMe === false) {
    return; // Do nothing
  }

  const jid = message.key.remoteJid;
  let statusJidList = getStatusJidList();
  const realMessage = message.message.conversation || message.message.extendedTextMessage.text;
  const commandParts = realMessage.split(' '); // Splitting the message to get arguments
  const phoneNumber = commandParts[1]; // This is the number passed with the command

  let targetJid = jid; // Default to the sender's JID if no phone number is provided

  if (phoneNumber) {
    // If a phone number is provided, process it
    const parsedPhoneNumber = parsePhoneNumberFromString(phoneNumber, 'NG'); // 'NG' for Nigeria, adjust if needed

    if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
      await sock.sendMessage(jid, { text: '⚠️ Invalid phone number format. Please provide a valid phone number.' });
      return;
    }

    // Convert phone number to WhatsApp JID format
    targetJid = `${parsedPhoneNumber.number.replace('+', '')}@s.whatsapp.net`;
  }

  // Action handling for adding/removing
  if (action === 'add') {
    if (statusJidList.includes(targetJid)) {
      await sock.sendMessage(jid, { text: '✅ User is already added to the status viewers list.' });
    } else {
      statusJidList.push(targetJid);
      saveStatusJidList(statusJidList);
      await sock.sendMessage(jid, { text: `✅ ${targetJid} has been successfully added to the status viewers list.` });
    }
  } else if (action === 'remove') {
    if (statusJidList.includes(targetJid)) {
      statusJidList = statusJidList.filter(item => item !== targetJid);
      saveStatusJidList(statusJidList);
      await sock.sendMessage(jid, { text: `❌ ${targetJid} has been successfully removed from the status viewers list.` });
    } else {
      await sock.sendMessage(jid, { text: '⚠️ User is not in the status viewers list.' });
    }
  }
}
// Handler for the check viewers command
async function handleCheckViewersCommand(sock, message) {
  // Restriction for groups and non-fromMe messages
  if (message.key.remoteJid.includes('@g.us') || message.key.fromMe === false) {
    return; // Do nothing
  }

  const jid = message.key.remoteJid;
  const statusJidList = getStatusJidList();

  if (statusJidList.includes(jid)) {
    await sock.sendMessage(jid, { text: '✅ User is in the status viewers list.' });
  } else {
    await sock.sendMessage(jid, { text: '❌ User is not in the status viewers list.' });
  }
}

const addCommand = new Command(
  'add',
  'Add a user to view your status',
  async (sock, message) => await handleAddOrRemoveCommand(sock, message, 'add'),
  'private'
);

const removeCommand = new Command(
  'remove',
  'Remove a user from viewing your status',
  async (sock, message) => await handleAddOrRemoveCommand(sock, message, 'remove'),
  'private'
);

const checkViewersCommand = new Command(
  'check',
  'Check if a user is in the status viewers list',
  async (sock, message) => await handleCheckViewersCommand(sock, message),
  'private'
);

const postCommand = new Command(
  'post',
  'Post a quoted image or video to status',
  handleStatusCommand,
  'private'
);

module.exports = { addCommand,checkViewersCommand, removeCommand, postCommand };
