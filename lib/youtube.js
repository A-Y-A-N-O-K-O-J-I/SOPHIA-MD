const axios = require('axios');
const fsPromises = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

async function urlToBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error(`Error fetching media from URL: ${error.message}`);
        throw new Error('Failed to fetch media from URL');
    }
}



async function ytsmp3(search) {
  try {
    const response = await axios.get('https://youtube-search-api3.p.rapidapi.com/youtube/search/', {
      params: { q: search },
      headers: {
        'x-rapidapi-key': 'be0698908amsh8c35595ef8f33c3p133246jsnbd8df3e6204b',
        'x-rapidapi-host': 'youtube-search-api3.p.rapidapi.com',
      }
    });
    
    // Extract first result
    const firstResult = response.data.result.result[0];
    
    return {
      link: firstResult.link,
      thumbnail: firstResult.thumbnails[0].url,
      title: firstResult.title
    };
  } catch(error) {
    console.error('Error', error);
    throw error; // Re-throw to allow caller to handle
  }
}


async function ytdlmp3(url) {
    try {
        const response = await axios.get('https://api.davidcyriltech.my.id/download/ytmp3', {
            params: {
                url: url
            }
        });
const url_download = response.data?.result?.download_url;
        if (!url_download) {
            throw new Error('Download URL not found');
        }

        return url_download;
    } catch (error) {
        console.error(`YouTube download error: ${error.message}`);
        throw Error
    }
}


// It won't work if you don't reencode thr Audio
async function reencodeAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate('128k')
            .audioCodec('libmp3lame')
            .on('end', () => {
                console.log(`Re-encoded audio saved at: ${outputPath}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error(`Error re-encoding audio: ${err.message}`);
                reject(new Error('Failed to re-encode audio'));
            })
            .save(outputPath);
    });
}

async function ytsdlmp3(search){
  try{
  const url = await ytsmp3(search);
  const download_url = await ytdlmp3(url.link);
  const buffer = await urlToBuffer(download_url);
  return buffer;
  }
  catch(error){
    console.error(`An error occurred ${error}`)
    throw error
  }
}

// Example usage function
async function sendYouTubeAudio(sock, message, search) {
    try {
        const audioBuff = await ytsdlmp3(search);
        const {link,thumbnail,title} = await ytsmp3(search)
        const pic = await urlToBuffer(thumbnail);
        await sock.sendMessage(message.key.remoteJid, {
            audio:  audioBuff,
            mimetype: 'audio/mpeg',
            contextInfo: {
            externalAdReply: {
                title: title,
                showAdAttribution: true,  
                sourceUrl: link,
                thumbnail: pic,
                mediaType: 1,
                renderLargerThumbnail: true,  
            },
        },
            
        });

    } catch (error) {
        console.error(`Error sending audio: ${error}`);
        // Send error message to user
        await sock.sendMessage(message.key.remoteJid, {
            text: `Failed to process audio: ${error.stack}`
        });
    }
}

module.exports={
ytsmp3,
ytsdlmp3,
ytdlmp3,
urlToBuffer,
reencodeAudio,
sendYouTubeAudio
}