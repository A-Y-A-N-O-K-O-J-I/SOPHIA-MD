// config.js
module.exports = {
    SUDO: process.env.SUDO ? process.env.SUDO.split(',') : ['2348073765008', '2347017895743'], // Fallback to default if not set
    OWNER: process.env.OWNER || 'kuju', // Updated owner name
    HANDLER: process.env.PREFIX || '#',
    MODE: process.env.MODE || 'private'
};
