const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys'); // Adjust this to match your library import
const { AssemblyAI } = require('assemblyai');
const axios = require('axios');
const react = require("react");
const { gpt } = require('../lib/ai')
let sophia;
// AssemblyAI setup
const client = new AssemblyAI({
  apiKey: 'ffb8372913cb4f0299ebb7a34d41656e', // Replace with your AssemblyAI API key
});

async function handleTranscriptionCommand(sock, message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

  if (!quoted?.audioMessage) {
    // If no quoted audio, send an error message and reaction
   await console.wa('_Please quote an Audio message to change to text_', message)
    await console.waReact('✖️',message.key)
  await  delay(3000)
	  console.waReact(null,message.key)
    return;
  }

  try {
    const mediaPath = path.join(__dirname, '../temp');
    if (!fs.existsSync(mediaPath)) fs.mkdirSync(mediaPath);

    const audioFilePath = path.join(mediaPath, `audio_${Date.now()}.mp3`);

    // Send loading reaction
    await sock.sendMessage(message.key.remoteJid, {
      react: { text: '⏳', key: message.key },
    });

    // Download the quoted audio
    const mediaStream = await downloadMediaMessage(
      {
        key: {
          id: message.message.extendedTextMessage.contextInfo.stanzaId,
          remoteJid: message.key.remoteJid,
          participant: message.message.extendedTextMessage.contextInfo.participant,
        },
        message: quoted,
      },
      sock
    );

    // Save the audio file locally
    const writeStream = fs.createWriteStream(audioFilePath);
    await new Promise((resolve, reject) => {
      mediaStream.pipe(writeStream);
      mediaStream.on('finish', resolve);
      mediaStream.on('error', reject);
    });

    // Send the audio file to AssemblyAI for transcription
    const params = {
      audio: fs.createReadStream(audioFilePath), // Provide the file stream
    };

    const transcript = await client.transcripts.transcribe(params);

    if (transcript.status === 'error') {
      console.error(`Transcription failed: ${transcript.error}`);
      await sock.sendMessage(message.key.remoteJid, {
        text: 'Failed to transcribe the audio. Please try again later.',
        quoted: message,
      });
      // Send error reaction
      await sock.sendMessage(message.key.remoteJid, {
        react: { text: '❌', key: message.key },
      });
 await  delay(5000)
console.waReact(null,message.key)
      return;
    }

    // Reply with the transcribed text
    await sock.sendMessage(message.key.remoteJid, {
      text: transcript.text},
	    { quoted: message}
    );

    // Send success reaction
    await sock.sendMessage(message.key.remoteJid, {
      react: { text: '📑', key: message.key },
    });
await delay(5000)
await console.waReact(null,message.key)
    // Clean up the temporary audio file
    fs.unlinkSync(audioFilePath);
  } catch (error) {
    console.error('Error handling transcription:', error);
    await sock.sendMessage(message.key.remoteJid, {
      text: 'An error occurred while processing the transcription.',
      quoted: message,
    });
    // Send error reaction
    await sock.sendMessage(message.key.remoteJid, {
      react: { text: '❌', key: message.key },
    });
  }
}
if(!sophia) sophia = require('sophia')
sophia({
  name: 'gpt',
  description: 'Chat with GPT',
  execute: async (sock, message, args) => {
    await react('p', message);

    if (!args || args.length === 0) {
      await delay(2000);
      await console.wa("Please give GPT a query like .gpt hello", message);
      await delay(1000);
      await react("e", message);
      return;
    }

    const query = args.join(" ");
    try {
    //  const userId = sock.user.id.split(':')[0];
      const reply = await gpt(query);

      if (!reply) {
        await react("e", message);
        await console.wa("GPT failed to generate a response. Try again later.", message);
        return;
      }

      await react("c", message);
      await console.wa(reply, message);
    } catch (error) {
      await react("e", message);
      console.error("GPT command error:", error);
      await console.wa(`GPT error: ${error.message}`, message);
    }
  },
  accessLevel: 'public',
  category: 'ai',
  isGroupCommand: false
});

sophia({ 
name:'trans',
description:'change voice to text',
execute: handleTranscriptionCommand,
accessLevel:'public',
category:'ai',
isgroup:false
});
