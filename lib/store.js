const fs = require('fs');
const path = require('path');
const makeInMemoryStore = require('baileys').makeInMemoryStore;
const { proto } = require('baileys');
// Create a store instance
const logger = require('pino')({ level: 'silent' }); // Modify logger as needed

// Path to your store file (adjust if needed)
const storeFile = './store.json';

// Safe loader function
function loadStore() {
    try {
        const data = fs.readFileSync(storeFile, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // Handle JSON error silently
        if (err instanceof SyntaxError) {
            console.error('Corrupt store file detected. Resetting store silently.');
            fs.writeFileSync(storeFile, '{}');  // Empty object
            return {}; // Return empty store
        }
        throw err; // Other errors (like file not existing) should still throw
    }
}

// Create the store
const store = makeInMemoryStore({
    storage: {
        read: () => loadStore(),
        write: (data) => fs.writeFileSync(storeFile, JSON.stringify(data, null, 2))
    }
});

const storeFilePath = path.join(__dirname, './database/baileys_store_multi.json');
const folderPath = path.join(__dirname, './database');

if(!fs.existsSync(folderPath)){
  fs.mkdirSync(folderPath);
}

// Read store data from file (if it exists)
if (fs.existsSync(storeFilePath)) {
  store.readFromFile(storeFilePath);
  console.log('Store data loaded from file.');
}

// Save store data to file periodically
setInterval(() => {
  store.writeToFile(storeFilePath);
}, 10_000);

// Function to load a message using the store
async function loadMessage(remoteJid, messageId) {
  if (store) {
    try {
      const msg = await store.loadMessage(remoteJid, messageId);
      return msg || undefined;
    } catch (error) {
      console.error('Failed to load message:', error);
      return undefined;
    }
  }
  return undefined;
}

// Function to get a message (fallback to a default if no store is present)
async function getMessage(key) {
  if (store) {
    const msg = await loadMessage(key.remoteJid, key.id);
    return msg || undefined;
  }
  // Return an empty message object as fallback
  return proto.Message.fromObject({});
}
const lastMessage = async (chatId) => {
  try {
    // Load the most recent message for the chat
    const messages = await store.loadMessages(chatId, 1, null);

    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      return lastMessage;
    } else {
      console.error(`No messages found for chat: ${chatId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving last message in chat ${chatId}:`, error.message);
    return null;
  }
};

// Export the store and helper functions
module.exports = {
  store,
  loadMessage,
  getMessage,
  lastMessage
};
