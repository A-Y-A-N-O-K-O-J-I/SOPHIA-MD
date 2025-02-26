const axios = require('axios');
const { checkURL } = require('../lib/functions');
const { MODE, SUDO } = require('../config');

// Store global auto-download status and listener reference
let isAutoDownloadEnabled = false;
let globalListener = null;

async function downloadVideo(m) {
  try {
    const jid = m.key.remoteJid || m.key.participant;
    
    // If auto-download is not enabled globally, return
    if (!isAutoDownloadEnabled) {
      return;
    }

    const text = m.message?.conversation || 
                 m.message?.extendedTextMessage?.text || 
                 m.message?.extendedTextMessage?.matchText || 
                 null;

    if (!text) return;

    // Check permissions based on MODE
    if (MODE === 'private') {
      // In private mode, only allow SUDO numbers and self messages
      const sender = m.key.participant || m.key.remoteJid;
      if (!SUDO.some(sudo => sender.includes(sudo)) && !m.key.fromMe) {
        return;
      }
    }
    // In public mode, allow all messages

    const urlType = checkURL(text);
    if (['youtube', 'tiktok', 'facebook', 'instagram'].includes(urlType)) {
      const url = 'https://api.davidcyriltech.my.id/download/aio';
      const response = await axios.get(url, {
        params: { url: text }
      });

      const dlurl = response.data.video.high_quality;
      const dlTitle = response.data.video.title;

      await console.wa('_*Downloading video...*_', m);
      await console.waMedia.sendVideo({ url: dlurl }, dlTitle, m);
    }
  } catch (error) {
    console.error('Error in downloadVideo:', error);
  }
}

const sophia = require('sophia');

sophia({
  name: 'autodownload',
  description: 'Toggles global auto-download for video links',
  execute: async function (sock, message, args) {
    try {
      const toggle = args[0]?.toLowerCase();
      
      // Check if user has permission to toggle
      if (MODE === 'private') {
        const sender = message.key.participant || message.key.remoteJid;
        if (!SUDO.some(sudo => sender.includes(sudo)) && !message.key.fromMe) {
          await console.wa('You do not have permission to use this command', message);
          return;
        }
      }

      if (!toggle || !['on', 'off'].includes(toggle)) {
        await console.wa('Usage: adownload <on|off>', message);
        return;
      }

      if (toggle === 'on') {
        if (isAutoDownloadEnabled) {
          await console.wa('Auto download is already active globally', message);
          return;
        }

        // Create the listener function
        globalListener = async (m) => {
          if (m.messages?.[0]) {
            await downloadVideo(m.messages[0]);
          }
        };

        // Enable global auto-download and attach listener
        isAutoDownloadEnabled = true;
        sock.ev.on('messages.upsert', globalListener);

        await console.wa(`Auto download is now active globally${MODE === 'private' ? ' (SUDO numbers only)' : ''}`, message);
      } else if (toggle === 'off') {
        if (!isAutoDownloadEnabled) {
          await console.wa('Auto download is not active', message);
          return;
        }

        // Remove only our specific listener
        if (globalListener) {
          sock.ev.off('messages.upsert', globalListener);
          globalListener = null;
        }

        // Disable global auto-download
        isAutoDownloadEnabled = false;

        await console.wa('Auto download is now disabled globally', message);
      }
    } catch (error) {
      console.error('Error in adownload command:', error);
      await console.wa('An error occurred while processing your request', message);
    }
  }
});