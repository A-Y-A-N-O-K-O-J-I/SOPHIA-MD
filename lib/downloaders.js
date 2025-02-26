const axios = require('axios');
const cheerio = require('cheerio');

async function downloadTiktokVideo(tiktok) {
    try {
        const response = await axios.post(
            'https://ssstik.io/abc?url=dl',
            new URLSearchParams({
                id: tiktok,
                locale: 'en',
                tt: 'MlZIVUY0',
            }).toString(),
            {
                headers: {
                    'HX-Request': 'true',
                    'HX-Trigger': '_gcaptcha_pt',
                    'HX-Target': 'target',
                    'HX-Current-URL': 'https://ssstik.io/',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
                    'Referer': 'https://ssstik.io/',
                }
            }
        );

        const $ = cheerio.load(response.data);
        const downloadLink = $('a').attr('href');

        return downloadLink || null; // Ensures a valid return
    } catch (error) {
        console.error("Error fetching data:", error.response ? error.response.data : error.message);
        return null; // Explicitly return null on failure
    }
}

module.exports = { downloadTiktokVideo };