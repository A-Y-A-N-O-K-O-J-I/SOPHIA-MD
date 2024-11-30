const config = require('../config'); // Import config

class Command {
    constructor(name, description, execute, accessLevel = 'public') {
        this.name = name; // Command name
        this.description = description; // Command description
        this.execute = execute; // Function to execute the command
        this.accessLevel = accessLevel; // Access level: public, private, owner
    }

    // Add a method to get the full command with the prefix
    get fullCommand() {
        return `${config.HANDLER}${this.name}`; // Return full command
    }
}

module.exports = Command; // Export the Command class
