const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "bot-state.json");

// Initialize bot state file if it doesn't exist
function initializeState() {
  if (!fs.existsSync(STATE_FILE)) {
    const initialState = {
      paired: false,
      sessionId: "SOPHIA_MD_SESSION",
      phoneNumber: null,
      lastConnected: null,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2));
    console.log("📝 Initialized bot-state.json");
  }
}

// Read bot state
function getBotState() {
  try {
    const data = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading bot state:", error);
    return null;
  }
}

// Update bot state
function updateBotState(updates) {
  try {
    const currentState = getBotState();
    const newState = { ...currentState, ...updates };
    fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));
    console.log("✅ Bot state updated:", updates);
    return true;
  } catch (error) {
    console.error("Error updating bot state:", error);
    return false;
  }
}

// Mark as paired
function markAsPaired(phoneNumber = null) {
  return updateBotState({
    paired: true,
    phoneNumber,
    lastConnected: new Date().toISOString(),
  });
}

// Mark as unpaired
function markAsUnpaired() {
  return updateBotState({
    paired: false,
    phoneNumber: null,
    lastConnected: null,
  });
}

// Check if bot is paired
function isPaired() {
  const state = getBotState();
  return state ? state.paired : false;
}

module.exports = {
  initializeState,
  getBotState,
  updateBotState,
  markAsPaired,
  markAsUnpaired,
  isPaired,
};