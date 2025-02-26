const fs = require('fs');
const path = require('path');
const { registerCommand } = require('./commandHandler'); // Import the registerCommand function

const commandFileMap = new Map();

// Dynamically register all commands from the commands directory
const registerCommands = async () => {
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        try {
            const commandModule = require(path.join(commandsPath, file));

            // Loop through all exported commands
            if (commandModule && typeof commandModule === 'object') {
                Object.values(commandModule).forEach(command => {
                    if (command instanceof require('../lib/Command')) {
                        registerCommand(command); // Register the command
                        commandFileMap.set(command.name, file); // Map the command name to the file
                    } else {
                        console.warn(`Skipping invalid command export in file: ${file}`);
                    }
                });
            } else {
                console.warn(`Skipping invalid export in file: ${file}`);
            }
        } catch (error) {
            console.error(`❌ Failed to register command from ${file}:\n`, error); // Logs the full error stack
            continue; // Continue with the next command file
        }
    }
};

module.exports = { registerCommands, commandFileMap };