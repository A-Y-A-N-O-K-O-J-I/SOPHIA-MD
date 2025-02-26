const axios = require('axios'); // To make HTTP requests
const Command = require('../lib/Command');
const {SUDO} = require('../config')
const { isValidTikTokURL} = require('../lib/functions')
const sophia = require('sophia');
const react = require('react')
const {downloadTiktokVideo} = require('../lib/downloaders')

function isFbUrl(url) {
    const regex = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+$/;
    return regex.test(url);
}


async function fbUrlDownloadHd(sock, message, args) {
    // Extract the URL from args or the quoted message
    const input = args[0] || 
                  m.quoted?.conversation || 
                  m.quoted?.extendedTextMessage?.matchedText;
    if (!input) {
        await console.wa('Please provide a Facebook URL or reply to a message with a valid Facebook link.',message);
        return;
    }

    // Check if the input is a valid Facebook URL
    if (!isFbUrl(input)) {
        await console.wa('This is not a valid Facebook link. Please send a valid Facebook URL.\nFor example: .fb www.facebook.com',message);
        return;
    }

    try {
        // Fetch the Facebook video from the API
        const response = await axios.get('https://bk9.fun/download/fb', {
            params: {
                url: input,
            }
        });

        // Extract HD video URL
        const fbVideo = response.data?.BK9?.hd;
        
        if (!fbVideo) {
            await console.wa('No HD video found for this link.',message);
            return;
        }

        // Send the video
        await console.waMedia.sendVideo(
            { url: fbVideo }, 
            '> VIDEO DOWNLOADED WITH SOPHIA-MD',message
        );
    } catch (err) {
        console.error('Error during Facebook video download:', err);
        await console.wa('An error occurred while processing your request.',message);
    }
}
const fbUrlCommand = new Command(
  'fb',
  'downloads fb video in hd with url',
  fbUrlDownloadHd,
  "public",
  "Downloaders",
  false
  );



sophia({
  name: 'tiktok',
  description: 'Download TikTok videos',
  execute: async (sock, message, args) => {
    try{
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quoting = quoted?.extendedTextMessage?.matchedText || 
                      quoted?.conversation || 
                      null; // Fallback

      // Get the TikTok URL from command or quoted text
      const url = args[0] || quoting;
      if (!url) {
        await console.wa('Please provide a valid TikTok URL in the format: #tiktok <URL>', message);
        return;
      }

      // Send pending reaction
      await react('p', message);

      // Download the video
      const videoUrl = await downloadTiktokVideo(url);

      if (!videoUrl) {
        await console.wa('Failed to retrieve the TikTok video. Please check the URL or try again later.', message);
        await react('e', message);
        return;
      }

      // Send the video
      await console.waMedia.sendVideo({ url: videoUrl }, '> DOWNLOADED WITH SOPHIA-MD', message);

      // Send complete reaction
      await react('c', message);
    } catch (error) {
      console.error('Error downloading TikTok video:', error);
      await console.wa('An error occurred while trying to download the TikTok video. Please try again later.', message);
      await react('e', message);
    }
  },
  accessLevel: 'public',
  category: 'Downloaders',
  isGroupOnly: false
});


module.exports = { fbUrlCommand };
