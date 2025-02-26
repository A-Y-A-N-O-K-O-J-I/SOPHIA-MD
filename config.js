const path = require('path');
const { existsSync } = require('fs');
const configPath = path.join(__dirname, './config.env');

if (existsSync(configPath)) require('dotenv').config({ path: configPath, override: true });

const toBool = (x) => x?.toLowerCase() === 'true';

module.exports = {                                                        
    SUDO: process.env.SUDO ? process.env.SUDO.split(',') : [''],
    OWNER: process.env.OWNER || '',
    AUTOLIKE: process.env.AUTO_LIKE_STATUS ? toBool(process.env.AUTO_LIKE_STATUS) : true,
    EMOJI: process.env.AUTO_LIKE_EMOJI || '🌚',
    HANDLER: process.env.PREFIX || '.',
    SESSION_ID: process.env.SESSION_ID || 'SOPHIA_MD-49BD5EE53F9644D4BD204A0F08F50678ZCVI4VUPJDB',
    DATABASE_URL: process.env.DATABASE_URL || '',
    MONGODB_URI: process.env.MONGODB_URI || '',
    MODE: process.env.MODE || 'private',
    STICKER_PACKNAME: process.env.STICKER_PACKNAME || '',
    PORT: process.env.PORT || 8000,
    FULL_LOGS: process.env.FULL_LOGS ? toBool(process.env.FULL_LOGS) : false,
    RENDER_URL: process.env.RENDER_APP_URL || '',
    RENDER: process.env.IS_RENDER ? toBool(process.env.IS_RENDER) : true
};