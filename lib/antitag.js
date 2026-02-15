const fs = require('fs');
const path = require('path');

const tagDetectionFile = path.join(__dirname, '../lib/database/tagDetection.json');

// Ensure the database file exists
const ensureTagDetectionFile = () => {
    if (!fs.existsSync(tagDetectionFile)) {
        fs.writeFileSync(tagDetectionFile, JSON.stringify([])); // Start with an empty array
    }
};

// Load active groups
const getActiveTagDetectionGroups = () => {
    ensureTagDetectionFile();
    return JSON.parse(fs.readFileSync(tagDetectionFile, 'utf-8'));
};

// Add a group to the active list
const enableTagDetection = (groupJid) => {
    const groups = getActiveTagDetectionGroups();
    if (!groups.includes(groupJid)) {
        groups.push(groupJid);
        fs.writeFileSync(tagDetectionFile, JSON.stringify(groups));
    }
};

// Remove a group from the active list
const disableTagDetection = (groupJid) => {
    const groups = getActiveTagDetectionGroups();
    const updatedGroups = groups.filter(jid => jid !== groupJid);
    fs.writeFileSync(tagDetectionFile, JSON.stringify(updatedGroups));
};

// Check if a group has tag detection enabled
const isTagDetectionEnabled = (groupJid) => {
    const groups = getActiveTagDetectionGroups();
    return groups.includes(groupJid);
};

module.exports = {
    enableTagDetection,
    disableTagDetection,
    isTagDetectionEnabled,
};