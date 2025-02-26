/*
const config = require('../config'); // Import config
*/
const { handlerPrefix} = require('./listener')
class Command {
    constructor(name, description, execute, accessLevel = 'public', category = 'General', isGroupOnly = false) {
        this.name = name; // Command name
        this.description = description; // Command description
        this.execute = execute; // Function to execute the command
        this.accessLevel = accessLevel; // Access level: public, private
        this.category = category; // Command category
        this.isGroupOnly = isGroupOnly; // Restrict command to group chats
    }

    // Get the full command with the prefix
    get fullCommand() {
     
        return `${handlerPrefix}${this.name}`;
    }
}

module.exports = Command;
