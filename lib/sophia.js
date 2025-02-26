const Command = require('./Command');
const { registerCommand } = require('./commandHandler'); // Import the registerCommand function

// Helper function to create and register commands
const sophia = ({ name, description, execute, accessLevel, category, isGroupOnly }) => {
    const command = new Command(
        name,
        description,
        execute,
        accessLevel,
        category,
        isGroupOnly
    );

    // Dynamically register the command
    registerCommand(command);

    // Return the command to allow exporting if needed
    return command;
};

module.exports = sophia;