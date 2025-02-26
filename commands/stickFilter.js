const downloadMedia = require('../lib/downloadMedia'); // assuming you have a utility function to download media
const {
addStickerFilter,
setupStickerListener,
removeStickerFilter,
listStickerFilters
} = require('../lib/stickerFilter');
const sophia = require('../lib/sophia');

sophia({
    name: 'pstick',
    description: 'Add a private sticker auto-reply.',
    execute: async (sock, message, args) => {
        if (!m.quoted?.stickerMessage) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Please reply a sticker to use this command.' });
        }

        const keyword = args.join(' ').trim();

        if (!keyword) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .pstick <keyword> (send a sticker).' });
        }

        try {
          
            const buffer = await downloadMedia(message);
            const base64Sticker = buffer.toString('base64');
            addStickerFilter('private', keyword, base64Sticker);
            setupStickerListener(sock);

            await console.wa(`Private sticker auto-reply added: "${keyword}"`,message);
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: `Error: ${err.message}` });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});

sophia({
    name: 'gstick',
    description: 'Add a group sticker auto-reply.',
    execute: async (sock, message, args) => {
        if (!m.quoted?.stickerMessage) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .gstick <keyword> (reply a sticker).' });
        }

        const keyword = args.join(' ').trim();

        if (!keyword) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .gstick <keyword> (reply a sticker).' });
        }

        try {
          
            const buffer = await downloadMedia(message);
            const base64Sticker = buffer.toString('base64');
            addStickerFilter('group', keyword, base64Sticker);
            setupStickerListener(sock);

            await console.wa(`Group sticker auto-reply added: "${keyword}"`,message);
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: `Error: ${err.message}` });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});

sophia({
    name: 'goffstick',
    description: 'removes a group sticker auto-reply.',
    execute: async (sock, message, args) => {

     const keyword = args.join(' ').trim();

        if (!keyword) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .goffstick <keyword>' });
        }

        try {
            removeStickerFilter('group', keyword);
            await console.wa(`Group sticker auto-reply removed: "${keyword}"`,message);
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: `Error: ${err.message}` });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});
sophia({
    name: 'poffstick',
    description: 'removes a private sticker auto-reply.',
    execute: async (sock, message, args) => {

     const keyword = args.join(' ').trim();

        if (!keyword) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .goffstick <keyword>' });
        }

        try {
            removeStickerFilter('private', keyword);
            await console.wa(`Private sticker auto-reply removed: "${keyword}"`,message);
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: `Error: ${err.message}` });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});
sophia({
    name: 'pliststick',
    description: 'list all private sticker auto-reply.',
    execute: async (sock, message, args) => {

        try {
         const lost = listStickerFilters('private')
            await console.wa(`Private sticker auto-replies: "${lost}"`,message);
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: `Error: ${err.message}` });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});
sophia({
    name: 'gliststick',
    description: 'list all group sticker auto-reply.',
    execute: async (sock, message, args) => {

        try {
         const lost = listStickerFilters('group')
            await console.wa(`group sticker auto-replies: "${lost}"`,message);
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: `Error: ${err.message}` });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});



