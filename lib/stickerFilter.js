const fs = require('fs');
const path = require('path');
const { base64ToBuffer } = require('./functions')
const stickersFile = path.join(__dirname, '../lib/database/stickerFilter.json'); // JSON storage for stickers
const stickerListeners = {};

// Load filters from file (stickers)
const loadStickerFilters = () => {
    if (!fs.existsSync(stickersFile)) fs.writeFileSync(stickersFile, JSON.stringify({ private: [], group: [] }, null, 2));
    return JSON.parse(fs.readFileSync(stickersFile, 'utf8'));
};

// Save filters to file (stickers)
const saveStickerFilters = (filters) => {
    fs.writeFileSync(stickersFile, JSON.stringify(filters, null, 2));
};

// Add sticker filter (pstick/gstick)
const addStickerFilter = (type, keyword, base64Sticker) => {
    const filters = loadStickerFilters();
    filters[type].push({ keyword, base64Sticker });
    saveStickerFilters(filters);
};

// Remove sticker filter (offstick)
const removeStickerFilter = (type, keyword) => {
    const filters = loadStickerFilters();
    const keywordTrimmed = keyword.trim().toLowerCase();
    const initialCount = filters[type].length;

    filters[type] = filters[type].filter(f => f.keyword.toLowerCase() !== keywordTrimmed);

    if (filters[type].length === initialCount) {
        throw new Error(`No sticker filter found for "${keyword}".`);
    }

    saveStickerFilters(filters);
};

// List sticker filters (plist/glist)
const listStickerFilters = (type) => {
    const filters = loadStickerFilters();
    return filters[type].map(f => `${f.keyword} -> Sticker`).join('\n') || 'No sticker filters set.';
};

// Setup listener for receiving messages and sending stickers (based on keyword)
const setupStickerListener = (sock) => {
    if (stickerListeners.main) {
        return;
    }

    stickerListeners.main = async (event) => {
        const filters = loadStickerFilters();
        const messages = event.messages || [];

        for (const msg of messages) {
            const jid = msg.key.remoteJid;
            const isGroup = jid.endsWith('@g.us');
            const type = isGroup ? 'group' : 'private';

            if (msg.key.fromMe) continue;
const allText = msg.message?.conversation || msg.message.extendedTextMessage.text;
            const text = allText.toLowerCase() || '';
            const filter = filters[type].find(f => text.includes(f.keyword.toLowerCase())); // Check if includes

            if (filter) {
                // Convert base64 to buffer and send the sticker
                const buffer = base64ToBuffer(filter.base64Sticker);
                await sock.sendMessage(jid, { sticker: buffer  });
            }
        }
    };

    sock.ev.on('messages.upsert', stickerListeners.main);
};


module.exports = {
    addStickerFilter,
    removeStickerFilter,
    listStickerFilters,
    setupStickerListener
};