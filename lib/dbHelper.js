const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const axios = require('axios');
const unzipper = require('unzipper');
const streamPipeline = promisify(pipeline);
const clientId = 'e65ey6z0zolw86l';
const clientSecret = 'qq72ha9lk12joiy';
const refreshToken = '-4s2xffXW-4AAAAAAAAAAaxMpw7cxJPzVCpK9luw6dNqBs655Oj-PSpfWGyJ9S1r'; // Save this securely
async function refreshAccessToken() {
    try {
        const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
            params: {
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            },
        });

        const newAccessToken = response.data.access_token;
        return newAccessToken; // Return the new access token
    } catch (error) {
        console.error('Error refreshing access token:', error.response?.data || error.message);
        throw error;
    }
}

async function unzipFile(zipPath, outputFolder) {
    if (!fs.existsSync(zipPath)) {
        console.error('ZIP file not found!');
        return;
    }

    fs.mkdirSync(outputFolder, { recursive: true });

    return new Promise((resolve, reject) => {
        fs.createReadStream(zipPath)
            .pipe(unzipper.Extract({ path: outputFolder }))
            .on('close', () => {
                console.log('Unzipping done!');
                resolve();
            })
            .on('error', (err) => {
                console.error('Error during unzipping:', err);
                reject(err);
            });
    });
}

// Example usage
unzipFile('./test.zip', './unzipped_folder');

async function downloadFile(sessionID, outputPath) {
    const rev = sessionID.split('~')[1];

    try {
        const url = 'https://content.dropboxapi.com/2/files/download';
        const accessToken = await refreshAccessToken();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Dropbox-API-Arg': JSON.stringify({ path: `rev:${rev}` }),
            },
        });

        if (!response.ok) {
            console.error('Error downloading file:', await response.text());
            return null;
        }

        // Create a writable stream to save the file
        const fileStream = fs.createWriteStream(outputPath);

        // Stream the response body directly to the file
        await streamPipeline(response.body, fileStream);

        console.log(`File downloaded successfully to ${outputPath}`);
        return outputPath;
    } catch (error) {
        console.error('Error downloading file:', error);
        return null;
    }
}


module.exports = { downloadFile,unzipFile }