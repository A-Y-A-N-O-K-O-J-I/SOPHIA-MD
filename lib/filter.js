const fs = require('fs');
const path = require('path');
const filtersFile = path.join(__dirname, '../lib/database/filters.json'); // JSON storage
const replyListeners = {};

// Helper functions
const loadFilters = () => {
    if (!fs.existsSync(filtersFile)) fs.writeFileSync(filtersFile, JSON.stringify({ private: [], group: [] }, null, 2));
    return JSON.parse(fs.readFileSync(filtersFile, 'utf8'));
};

const saveFilters = (filters) => {
    fs.writeFileSync(filtersFile, JSON.stringify(filters, null, 2));
};

// Add filter (pfilter/gfilter)
const addFilter = (type, keyword, response) => {
    const filters = loadFilters();
    filters[type].push({ keyword, response });
    saveFilters(filters);
};

// Remove filter (pstop/gstop)
const removeFilter = (type, keyword) => {
    const filters = loadFilters();
    const keywordTrimmed = keyword.trim().toLowerCase();
    const initialCount = filters[type].length;

    filters[type] = filters[type].filter(f => f.keyword.toLowerCase() !== keywordTrimmed);

    if (filters[type].length === initialCount) {
        throw new Error(`No auto-reply found for "${keyword}".`);
    }

    saveFilters(filters);
};

// List filters (plist/glist)
const listFilters = (type) => {
    const filters = loadFilters();
    return filters[type].map(f => `${f.keyword} -> ${f.response}`).join('\n') || 'No filters set.';
};

const setupListener = (sock) => {
    if (replyListeners.main) {
      return;
    }

    replyListeners.main = async (event) => {
        const filters = loadFilters();
        const messages = event.messages || [];

        for (const msg of messages) {
            const jid = msg.key.remoteJid;
            const isGroup = jid.endsWith('@g.us');
            const type = isGroup ? 'group' : 'private';

            if (msg.key.fromMe) continue;

            const text = msg.message?.conversation?.toLowerCase() || '';
            const filter = filters[type].find(f => text.includes(f.keyword.toLowerCase())); // Check if includes

            if (filter) {
                await sock.sendMessage(jid, { text: filter.response });
            }
        }
    };

    sock.ev.on('messages.upsert', replyListeners.main);
}
module.exports = {
    addFilter,
    removeFilter,
    listFilters,
    setupListener
};