// lib/CommandRegistry.js
const { registerCommand } = require('./commandHandler'); // Import the registerCommand function
const { pingCommand,statusCommand,defineCommand,forwardCommand } = require('../commands/ping');
const viewonceCommand = require('../commands/viewonce');
const animeCommand = require('../commands/anime');
const uptimeCommand = require('../commands/uptime');
const neonCommand =require('../commands/textmaker');
const quoteCommand = require('../commands/quoteResponder');
const triviaCommand = require('../commands/trivia');
const quotedImageCommand = require('../commands/imagequote');
const viewOnceCommand = require('../commands/vv');
const quotedMediaCommand = require('../commands/save');
const postCommand = require('../commands/repost');
const testCommand = require('../commands/test');
const listCommand = require('../commands/menu');
const testCommand2 = require('../commands/test2');
const listContactsCommand = require('../commands/contacts')
const bugCommand = require('../commands/bug');
// Import the uptime command

// Function to register all commands
const registerCommands = () => {
    registerCommand(pingCommand);
    registerCommand(animeCommand);
    registerCommand(uptimeCommand);
    registerCommand(neonCommand);
    registerCommand(quoteCommand);
    registerCommand(viewonceCommand);
    registerCommand(statusCommand);
    registerCommand(defineCommand);
    registerCommand(triviaCommand);
    registerCommand(forwardCommand);
    registerCommand(quotedImageCommand);
    registerCommand(viewOnceCommand);
    registerCommand(quotedMediaCommand);
    registerCommand(postCommand);
    registerCommand(testCommand);
    registerCommand(listCommand);
    registerCommand(testCommand2);
  registerCommand(listContactsCommand);
  registerCommand(bugCommand);
    // Register the all commands here

};

// Export the registerCommands function
module.exports = { registerCommands };
