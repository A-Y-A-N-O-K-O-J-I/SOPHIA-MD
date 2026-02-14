const Command = require('../lib/Command'); 
const fs = require('fs');
const { version } = require('../package.json');
const { commands } = require('../lib/commandHandler');
const os = require('os');
const moment = require('moment'); 
const config = require('../config');
const path = require('path');

// Utility function to check memory usage
function formatMemoryUsage() {
    const totalMemory = os.totalmem() / 1e9; // in GB
    const freeMemory = os.freemem() / 1e9; // in GB
    return `${freeMemory.toFixed(2)} GB / ${totalMemory.toFixed(2)} GB`;
}

// Format uptime in a readable format
function formatUptime() {
    const uptime = moment.duration(os.uptime(), 'seconds').humanize();
    return uptime;
}

// Database check
function getDatabaseInfo() {
    const db = config.DATABASE_URL ? "PostgreSQL" : "MongoDB (or Local)";
    return db;
}

const imagePath = path.join(__dirname, "..", "assets", "menu.jpg");

const listCommands = async (sock, message) => {
    try {
        // Get system info
        const uptime = formatUptime();
        const owner = config.OWNER || 'AYANOKOJI';
        const memoryUsage = formatMemoryUsage();
        const currentTime = moment().format('hh:mm:ss A');
        const currentDate = moment().format('DD/MM/YYYY');
        const db = getDatabaseInfo();

        // Group commands by category
        const categorizedCommands = {};
        Array.from(commands.values()).forEach((cmd) => {
            const category = cmd.category || 'General';
            if (!categorizedCommands[category]) {
                categorizedCommands[category] = [];
            }
            const commandName = cmd.name ? cmd.name.toLowerCase() : 'unknown';
            categorizedCommands[category].push(commandName);
        });

        // Build the menu
        let responseText = `*SOPHIA-MD v${version}*\n\n`;
        
        // Bot info section
        responseText += `┌─ *BOT INFO*\n`;
        responseText += `│ Owner: ${owner}\n`;
        responseText += `│ Commands: ${commands.size}\n`;
        responseText += `│ Uptime: ${uptime}\n`;
        responseText += `│ RAM: ${memoryUsage}\n`;
        responseText += `│ Database: ${db}\n`;
        responseText += `│ Time: ${currentTime}\n`;
        responseText += `│ Date: ${currentDate}\n`;
        responseText += `└───────────\n\n`;

        // Commands by category
        for (const [category, cmds] of Object.entries(categorizedCommands)) {
            responseText += `┌─ *${category.toUpperCase()}*\n`;
            cmds.forEach(cmd => {
                responseText += `│ • ${cmd}\n`;
            });
            responseText += `└───────────\n\n`;
        }

        responseText += `_Type ${config.PREFIX}help <command> for more info_`;

        await sock.sendMessage(message.key.remoteJid, {
            text: responseText.trim(),
            contextInfo: {
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363368032185473@newsletter",
                    serverMessageId: 624,
                    newsletterName: "SOPHIA-MD"
                },
                /* externalAdReply: {
                    title: 'SOPHIA-MD',
                    thumbnail: fs.readFileSync(imagePath),
                    sourceUrl: "https://whatsapp.com/channel/0029VasFQjXICVfoEId0lq0Q",
                    showAdAttribution: true,
                    mediaType: 1,
                    renderLargerThumbnail: true,
                }, */
                isForwarded: true,
                forwardingScore: 1000
            }
        });
    } catch (error) {
        console.error('Error while listing commands:', error);
        await sock.sendMessage(message.key.remoteJid, { 
            text: '❌ Failed to list commands.' 
        });
    }
};

const listCommand = new Command('menu', 'List all available commands', listCommands);
module.exports = { listCommand };