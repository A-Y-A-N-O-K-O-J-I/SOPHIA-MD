const sophia = require('../lib/sophia');
const { 
    addFilter, 
    removeFilter, 
    listFilters, 
    setupListener 
} = require('../lib/filter');
sophia({
    name: 'pfilter',
    description: 'Add a private auto-reply.',
    execute: async (sock, message, args) => {
        if (!args[0]){
        return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .pfilter <keyword>,<response>' });
}
        const [keyword, response] = args.join(' ').split(',');
        if (!keyword || !response) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Invalid format. Use: .pfilter <keyword>,<response>' });
        }

        addFilter('private', keyword, response);
        setupListener(sock); // Ensure listener is running
        sock.sendMessage(message.key.remoteJid, { text: `Private auto-reply added: "${keyword}" -> "${response}"` });
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});

sophia({
    name: 'gfilter',
    description: 'Add a group auto-reply.',
    execute: async (sock, message, args) => {
        if (!args[0]) return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .gfilter <keyword>,<response>' });

        const [keyword, response] = args.join(' ').split(',');
        if (!keyword || !response) {
            return sock.sendMessage(message.key.remoteJid, { text: 'Invalid format. Use: .gfilter <keyword>,<response>' });
        }

        addFilter('group', keyword, response);
        setupListener(sock); // Ensure listener is running
        sock.sendMessage(message.key.remoteJid, { text: `Group auto-reply added: "${keyword}" -> "${response}"` });
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: true,
});

// Stop filter commands
sophia({
    name: 'pstop',
    description: 'Remove a private auto-reply.',
    execute: async (sock, message, args) => {
        if (!args[0]) {
          return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .pstop <keyword>' });
}
        const keyword = args.join(' ').trim();
        try {
            removeFilter('private', keyword);
            sock.sendMessage(message.key.remoteJid, { text: `Private auto-reply for "${keyword}" has been removed.` });
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: err.message });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});

sophia({
    name: 'gstop',
    description: 'Remove a group auto-reply.',
    execute: async (sock, message, args) => {
        if (!args[0]) {
          return sock.sendMessage(message.key.remoteJid, { text: 'Usage: .gstop <keyword>' });
}
        const keyword = args.join(' ').trim();
        try {
            removeFilter('group', keyword);
            sock.sendMessage(message.key.remoteJid, { text: `Group auto-reply for "${keyword}" has been removed.` });
        } catch (err) {
            sock.sendMessage(message.key.remoteJid, { text: err.message });
        }
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: true,
});

// List filter commands
sophia({
    name: 'plist',
    description: 'List private auto-replies.',
    execute: async (sock, message) => {
        const list = listFilters('private');
        sock.sendMessage(message.key.remoteJid, { text: `Private auto-replies:\n${list}` });
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: false,
});

sophia({
    name: 'glist',
    description: 'List group auto-replies.',
    execute: async (sock, message) => {
        const list = listFilters('group');
        sock.sendMessage(message.key.remoteJid, { text: `Group auto-replies:\n${list}` });
    },
    accessLevel: 'private',
    category: 'Auto-reply',
    isGroupCommand: true,
});