const fs = require('fs');
const path = require('path');
const { jidNormalizedUser } = require('baileys');

// Path to the config file
const CONFIG_PATH = path.join(__dirname,"database", 'autolike-config.json');

// Initialize or read config file
function initConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            // Create default config if it doesn't exist
            const defaultConfig = { autoLikeEnabled: true, defaultEmoji: "❤️" };
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        } else {
            // Read existing config
            const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(configData);
        }
    } catch (error) {
        console.error('Error initializing config:', error);
        // Return default config if there's an error
        return { autoLikeEnabled: true, defaultEmoji: "❤️" };
    }
}

// Function to toggle auto-like mode
async function autoLikeMode(mode, emoji = null) {
    try {
        const config = initConfig();
        
        // Update mode (on/off)
        if (mode === 'on' || mode === 'off') {
            config.autoLikeEnabled = (mode === 'on');
        }
        
        // Update emoji if provided
        if (emoji) {
            config.defaultEmoji = emoji;
        }
        
        // Save updated config
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        
        return {
            success: true,
            message: `Auto-like mode set to: ${mode}`,
            config
        };
    } catch (error) {
        console.error('Error updating auto-like mode:', error);
        return {
            success: false,
            message: 'Failed to update auto-like mode',
            error: error.message
        };
    }
}

// The updated AutolikeStatus function that checks config before reacting
async function AutolikeStatus(sock, message) {
    try {
        // Read current config
        const config = initConfig();
        
        // If auto-like is disabled, exit early
        if (!config.autoLikeEnabled) {
            return;
        }
        
        const myself = jidNormalizedUser(sock.user.id);
        const emojiToReact = config.defaultEmoji;

        if (message.key.remoteJid == "status@broadcast" && message.key.participant) {
            await sock.sendMessage(
                message.key.remoteJid,
                { react: { key: message.key, text: emojiToReact } },
                { statusJidList: [message.key.participant, myself] }
            );
        }
    } catch (error) {
        console.error('Error in AutolikeStatus:', error);
    }
}

// Helper function to check current auto-like status
function getAutoLikeStatus() {
    const config = initConfig();
    return {
        enabled: config.autoLikeEnabled,
        emoji: config.defaultEmoji
    };
}

module.exports = {
    AutolikeStatus,
    autoLikeMode,
    getAutoLikeStatus
};