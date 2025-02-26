const fs = require('fs');
const path = require('path');

// Path to the JSON file storing warnings
const warningsFile = path.join(__dirname, '../lib/database/warnings.json');

// Load warnings from file
const loadWarnings = () => {
    if (!fs.existsSync(warningsFile)) {
        fs.writeFileSync(warningsFile, JSON.stringify({}, null, 2));
    }
    return JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
};

// Save warnings to file
const saveWarnings = (warnings) => {
    fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
};

// Increment warning count for a participant
const incrementWarning = (groupJid, participant) => {
    const warnings = loadWarnings();
    if (!warnings[groupJid]) warnings[groupJid] = {};
    if (!warnings[groupJid][participant]) warnings[groupJid][participant] = 0;

    warnings[groupJid][participant] += 1;
    saveWarnings(warnings);
    return warnings[groupJid][participant];
};

// Reset warning count for a participant
const resetWarning = (groupJid, participant) => {
    const warnings = loadWarnings();
    if (warnings[groupJid]) {
        delete warnings[groupJid][participant];
        saveWarnings(warnings);
    }
};

// Get current warning count
const getWarningCount = (groupJid, participant) => {
    const warnings = loadWarnings();
    return warnings[groupJid]?.[participant] || 0;
};

module.exports = {
    incrementWarning,
    resetWarning,
    getWarningCount,
};