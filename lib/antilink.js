const fs = require('fs');
const path = require('path');

const linkDetectionFile = path.join(__dirname, '../lib/database/linkDetection.json');

// Ensure the database file exists
const ensureLinkDetectionFile = () => {
    if (!fs.existsSync(linkDetectionFile)) {
        fs.writeFileSync(linkDetectionFile, JSON.stringify([])); // Start with an empty array
    }
};

// Load active groups
const getActiveLinkDetectionGroups = () => {
    ensureLinkDetectionFile();
    return JSON.parse(fs.readFileSync(linkDetectionFile, 'utf-8'));
};

// Add a group to the active list
const enableLinkDetection = (groupJid) => {
    const groups = getActiveLinkDetectionGroups();
    if (!groups.includes(groupJid)) {
        groups.push(groupJid);
        fs.writeFileSync(linkDetectionFile, JSON.stringify(groups));
    }
};

// Remove a group from the active list
const disableLinkDetection = (groupJid) => {
    const groups = getActiveLinkDetectionGroups();
    const updatedGroups = groups.filter(jid => jid !== groupJid);
    fs.writeFileSync(linkDetectionFile, JSON.stringify(updatedGroups));
};

// Check if a group has link detection enabled
const isLinkDetectionEnabled = (groupJid) => {
    const groups = getActiveLinkDetectionGroups();
    return groups.includes(groupJid);
};

module.exports = {
    enableLinkDetection,
    disableLinkDetection,
    isLinkDetectionEnabled,
};