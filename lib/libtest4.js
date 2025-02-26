const fs = require('fs');

const panelFile = './database/panel.json';

// Ensure panel.json exists with default values
function setMode(toggle = null) {
    let data = { mode: 'off' }; // Default mode

    // If panel.json exists, read the current mode
    if (fs.existsSync(panelFile)) {
        data = JSON.parse(fs.readFileSync(panelFile, 'utf8'));
    }

    // If toggle is null, return current mode
    if (toggle === null) return data.mode;

    // Toggle or set mode
    if (toggle === 'on' || toggle === 'off') {
        data.mode = toggle;
        fs.writeFileSync(panelFile, JSON.stringify(data, null, 2));
        return true;
    }

    return false; // Invalid input
}

// Function to check if panel mode is ON
function isPanelModeOn() {
    if (!fs.existsSync(panelFile)) return false; // If file doesn't exist, treat as "off"

    const data = JSON.parse(fs.readFileSync(panelFile, 'utf8'));
    return data.mode === 'on';
}


module.exports = { setMode, isPanelModeOn };