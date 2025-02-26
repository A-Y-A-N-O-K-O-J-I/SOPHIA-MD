const Command = require('../lib/Command'); 
const fs = require('fs')
const { commands } = require('../lib/commandHandler');
const os = require('os');
const moment = require('moment'); 
const config = require('../config');
const path = require('path')
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

// Database check (to determine if PostgreSQL, MongoDB, or local is used)
function getDatabaseInfo() {
    // Assuming that your config has a method or value that tells you the DB being used
    const db = config.DATABASE_URL ? "PostgreSQL" : "MongoDB (or Local)";
    return db;
}
const imagePath = path.join(__dirname,"..","assets","menu.jpg")
const listCommands = async (sock, message) => {
    try {
        // Get system info
        const uptime = formatUptime();
        const owner = config.OWNER || 'AYANOKOJI';
        const memoryUsage = formatMemoryUsage();
        const currentTime = moment().format('hh:mm:ss A');
        const currentDate = moment().format('DD/MM/YYYY');
        const db = getDatabaseInfo();  // Get DB used

        // Group commands by category with a default category of 'General'
        const categorizedCommands = {};
        Array.from(commands.values()).forEach((cmd) => {
            const category = cmd.category || 'General';  // Default category as 'General' if undefined
            if (!categorizedCommands[category]) {
                categorizedCommands[category] = [];
            }
            const commandName = cmd.name ? cmd.name.toUpperCase() : 'UNKNOWN COMMAND';  // Ensure name exists
            categorizedCommands[category].push(`│  *${commandName}*`);
        });

        // Format the menu
        let responseText = 
	`≿━━━━༺❀𝑺𝑶𝑷𝑯𝑰𝑨-𝑴𝑫༻━━━━≾
╔═══.·:·.☽✧ ✦ ✧☾.·:·.═══╗
☆   MADE BY AYANOKOJI☆
╚═══.·:·.☽✧ ✦ ✧☾.·:·.═══╝

╔══════════════════════╗
║   
\`\`\`
➛OWNER: ${owner}
➛VERSION: 1.0.0
➛Commands: ${commands.size}
➛Uptime: ${uptime}
➛RAM: ${memoryUsage}
➛DB: ${db}
➛Time: ${currentTime}
➛Date: ${currentDate}
\`\`\`
╚══════════════════════╝

`;

        // List Commands by Category
        for (const [category, cmds] of Object.entries(categorizedCommands)) {
            responseText += `\n╔═══.·:·.☽✧ ✦ ${category.toUpperCase()} ✧☾.·:·.\n`;
            responseText += `|☞|${cmds.join('\n|☞|')}\n`;
            responseText += `╚═══.·:·.☽✧ ✦ ✧☾.·:·.\n`;
        }
	await sock.sendMessage(message.key.remoteJid,{
	 // image: fs.readFileSync(imagePath),
	  text:responseText.trim(),
	  contextInfo: {
	    externalAdReply: {
                 title: 'SOPHIA-MD',
                thumbnail: fs.readFileSync(imagePath),  // Optimized logo buffer
              showAdAttribution: true,  // Show attribution for the ad
               sourceUrl: 'https://whatsapp.com/channel/0029VasFQjXICVfoEId0lq0Q',  // URL for the ad
                mediaType: 1,                
              renderLargerThumbnail: true,
            },
	    isForwarded:true,
	    forwardingScore:1000
	  }
	})
    } catch (error) {
        console.error('Error while listing commands:', error);
        await sock.sendMessage(message.key.remoteJid, { text: '☠️ Failed to list commands.' });
    }
};


const listCommand = new Command('menu', 'List all available commands', listCommands);
module.exports = { listCommand };
