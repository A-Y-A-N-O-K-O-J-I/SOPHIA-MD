const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');
const Command = require('../lib/Command');

async function handleUploadVCF(sock, message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const key = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
  const participant = message.message?.extendedTextMessage?.contextInfo?.participant;

  const args = message.message?.conversation?.split(' ') || [];
  const Command = args[1]; // Check if it's delete

  const assetsPath = path.join(__dirname, '../lib/database');
  if (!fs.existsSync(assetsPath)) fs.mkdirSync(assetsPath);

  // Path for the VCF and JSON files
const jsonFilePath = path.join(__dirname, '../lib/database', 'status_viewers.json');
  const vcfFilePath = path.join(assetsPath, `${config.SESSION_ID}.vcf`);


  if (Command === 'delete') {
    console.log('Delete command received'); // Debugging line
    // Delete both the VCF and JSON files if they exist
    if (fs.existsSync(jsonFilePath)) {
      fs.unlinkSync(jsonFilePath);
      await sock.sendMessage(message.key.remoteJid, {
        text: '✅ *JSON file has been deleted successfully!*',
      });
    } else {
      await sock.sendMessage(message.key.remoteJid, {
        text: '⚠️ *No JSON file found to delete.*',
      });
    }

    if (fs.existsSync(vcfFilePath)) {
      fs.unlinkSync(vcfFilePath);
      await sock.sendMessage(message.key.remoteJid, {
        text: '✅ *VCF file has been deleted successfully!*',
      });
    } else {
      await sock.sendMessage(message.key.remoteJid, {
        text: '⚠️ *No VCF file found to delete.*',
      });
    }
    return;
  }

  if (quoted?.documentMessage) {
    try {
      const mimeType = quoted.documentMessage.mimetype;
      const validMimeTypes = ['text/x-vcard', 'text/vcard']; // Valid VCF MIME types
      if (!validMimeTypes.includes(mimeType)) {
        // If the file is not a VCF, send an error message and trigger delete command
        await sock.sendMessage(message.key.remoteJid, {
          text: '🚫 *This is not a valid VCF file!*\nPlease quote a valid VCF file to upload. 📂',
        });
        return;
      }

      // Check if JSON file already exists
      if (fs.existsSync(jsonFilePath)) {
        await sock.sendMessage(message.key.remoteJid, {
          text: `🛑 _*VCF ALREADY UPLOADED!*_`,
        });
        return;
      }

      // Download the VCF file
      const stream = await downloadMediaMessage(
        {
          key: { id: key, remoteJid: message.key.remoteJid, participant },
          message: quoted,
        },
        sock
      );

      // Save the VCF file
      const writeStream = fs.createWriteStream(vcfFilePath);
      await new Promise((resolve, reject) => {
        stream.pipe(writeStream);
        stream.on('end', resolve);
        stream.on('error', reject);
      });

      // Send a success message
      await console.wa(`✅ *VCF file uploaded successfully!* 🎉\nThe file has been saved.`,message)
      await sock.sendMessage(message.key.remoteJid, { react: { text: '✨', key: message.key } });

      // === NEW LOGIC: Get all contacts from VCF file and store JIDs in JSON ===
      const phoneNumbers = [];

      const rl = readline.createInterface({
        input: fs.createReadStream(vcfFilePath),
        output: process.stdout,
        terminal: false,
      });

      // Read phone numbers from the VCF file and format them as JIDs
      await new Promise((resolve, reject) => {
        rl.on('line', (line) => {
          if (line.startsWith('TEL;')) {
            const phoneNumber = line.split(':')[1].trim();
            const parsedNumber = parsePhoneNumberFromString(phoneNumber);
            if (parsedNumber && parsedNumber.isValid()) {
              const formattedNumber = parsedNumber
                .formatInternational()
                .replace('+', '')
                .replace(/\s+/g, '');
              phoneNumbers.push(`${formattedNumber}@s.whatsapp.net`);
            }
          }
        });

        rl.on('close', resolve);
        rl.on('error', reject);
      });

      // Store the JIDs in a JSON file as an array
const uniquePhoneNumbers = Array.from(new Set(phoneNumbers));

// Save the unique JIDs into the JSON file
fs.writeFileSync(jsonFilePath, JSON.stringify(uniquePhoneNumbers, null, 2));
      // Send a confirmation message
     await console.wa(`✅ *VCF contact list converted to status successfully!* 🎉\nFinished integrating status command.`,message)

      // Clean up: Delete the VCF file after processing
      fs.unlinkSync(vcfFilePath);

    } catch (error) {
      console.error('Error uploading VCF file:', error);
   await console.wa('☠️ *Failed to upload the VCF file.*\nPlease try again later.',message);
    }
  } else {
    // If no document is quoted, send an error message
  await console.wa('📄 *Please quote a VCF contact file to upload.* If you uploaded the wrong vcf file by mistake type upload delete and it will delete it',message)
  }
}

// Register the command
const uploadVCFCommand = new Command(
  'upload',
  'Upload a quoted VCF file, convert contacts to JIDs, and save them in a JSON file.',
  handleUploadVCF,
 'private',
 'Post',
 false
);

module.exports = { uploadVCFCommand };
