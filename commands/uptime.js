const Command = require('../lib/Command'); // Import the Command class

// Variable to store the bot's start time
let startTime = Date.now(); 

// The main function to handle the uptime command
async function handleUptimeCommand(sock, message) {
    const uptime = Date.now() - startTime; // Calculate uptime in milliseconds

    // Convert uptime to seconds, minutes, hours, and days
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format the uptime message
    const uptimeText = `*_The sophia-md has been active for_*: _${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds._`;

    await sock.sendMessage(message.key.remoteJid, { text: uptimeText });
}

// Register the uptime command
const uptimeCommand = new Command(
    'uptime', // Command name
    'Checks uptime of the bot', // Description
    handleUptimeCommand, // Function to execute
    'public', // Access level
    'Utility', // Category
    false // Group-only restriction
);

module.exports = { uptimeCommand };
