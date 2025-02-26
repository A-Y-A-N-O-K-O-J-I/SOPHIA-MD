const { useMultiFileAuthState, Browsers, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const pino = require('pino');
const { Boom } = require('@hapi/boom')
const fs = require('fs');
const path = require('path');
const { setupLinkDetection } = require('./antilink2');
const { registerCommands } = require('./CommandRegistry');
const { messageListener,groupListener } = require('./listener');
const { downloadFile,unzipFile } = require('./dbHelper');
const sendRestartMessage = require('./restartMessage');
const config = require('../config');
const { execSync } = require('child_process');
const { store, getMessage } = require('./store');
const { delay } = require('./functions');
const NodeCache = require('node-cache')
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })
// const proxy = "socks5://185.83.144.132:60096"; 


async function connectionLogic() {
  try {
    const sessionId = config.SESSION_ID;
    const authDir = './auth';
    const credsFile = path.join(authDir, 'creds.json');
    let retryCount = 0;
    let sessionRetryCount = 0; // Tracks retries for session errors
    let restartMessageSent = false;
    console.log('Initializing connection... ⏳');

    if (!sessionId) {
      throw new Error('SESSION_ID NOT FOUND');
    }

    if (!sessionId.includes('sophia_md')) {
      throw new Error('SESSION_ID INVALID');
    }

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir);
    }

    if (!fs.existsSync(credsFile)) {
      try {
        console.log('Loading Authentication file...👾');
        const authZipFile = await downloadFile(sessionId, path.join(__dirname,'..','temp','auth.zip'));
        await unzipFile(authZipFile,authDir)
        if (!authZipFile) {
          throw new Error('Session file not found or empty.');
        }
      } catch (error) {
        console.error(`SESSION_ID ERROR: ${error.message}`);
        process.exit(1);
      }
    }

    let credsData;
    try {
     credsData = fs.readFileSync(credsFile, 'utf8');
    } catch (error) {
      console.error('Error reading creds file:', error.message);
      process.exit(1);
    }

    let creds;
    try {
      creds = JSON.parse(credsData);
    } catch (error) {
      console.error('Invalid JSON format in creds file. Resetting session...');
      fs.rmSync(authDir, { recursive: true, force: true });
      process.exit(1);
    }

    const botNumber = creds?.me?.id || 'Unknown';
    console.log('Bot Number:', botNumber);

    let state, saveCreds;
    try {
      ({ state, saveCreds } = await useMultiFileAuthState(authDir));
    } catch (error) {
      console.error('Error initializing authentication state:', error.message);
      process.exit(1);
    }

    let version, isLatest;
    try {
      ({ version, isLatest } = await fetchLatestBaileysVersion());
    } catch (error) {
      console.error('Error fetching WhatsApp version:', error.message);
      version = [2, 2204, 13]; // Default version fallback
    }

    console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
async function connect() {
      try {
        console.log('Attempting to connect to WhatsApp ⬆️');
        sock = makeWASocket({
          version,
          auth: state,
          logger: pino({ level: 'silent' }),
          printQRInTerminal: false,
          browser: Browsers.macOS('Safari'),
          syncFullHistory: false,
          cachedGroupMetadata: async (jid) => groupCache.get(jid),
          generateHighQualityLinkPreview: true,
          getMessage: async (key) => {
            try {
              return await getMessage(key);
            } catch (error) {
              console.error('Error getting message:', error.message);
              return null;
            }
          },
        });

        store.bind(sock.ev);

        sock.ev.on('connection.update', async (update) => {
          try {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
              console.log('✅ Connected to WhatsApp successfully.');
              retryCount = 0;
              sessionRetryCount = 0; // Reset session retry counter

              if (!restartMessageSent) {
                await delay(4000)
                sendRestartMessage(sock);
                restartMessageSent = true;
              }
            } if (connection === 'close') {
              const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
           if (reason === DisconnectReason.badSession) {
           //  console.log(lastDisconnect)
                console.warn(`⚠️ Session Error (Bad MAC) detected! Retrying... (${sessionRetryCount + 1}/2)`);
                sessionRetryCount++;
                if (sessionRetryCount < 2) {
                  connect(); // Retry once more
                } else {
                  console.error('❌ Session error persisted. Resetting auth data...');
                  fs.rmSync(authDir, { recursive: true, force: true });
                  connectionLogic();
                }
              } else if (reason === DisconnectReason.loggedOut) {
                console.error('❌ Bot logged out. Deleting session and stopping...');
                fs.rmSync(authDir, { recursive: true, force: true });
                process.exit(1);
              } else if (reason === DisconnectReason.timedOut) {
                await delay(5000)
                console.error('⏰ Timed out. Restarting connection...');
                connect();
                
              }
              else if (reason === DisconnectReason.multideviceMismatch) {
                console.error('multideviceMismatch... Restarting connection...');
                connect();
                
              }
              else if (reason === DisconnectReason.restartRequired) {
            console.log('[Server Restarting....!]')
            connectionLogic()
              }
              else if (++retryCount > 3) {
                console.error('❌ Retry limit exceeded. Stopping...');
                process.exit(1);
              } else {
                console.warn(`🔄 Reconnecting (${retryCount}/3)...`);
                await delay(5000);
                connect();
              }
            }
          } catch (error) {
            console.error('Error in connection update:', error.message);
          }
        });

        sock.ev.on('creds.update', async () => {
          try {
            await saveCreds();
          } catch (error) {
            console.error('Error saving credentials:', error.message);
          }
        });

        try {
          registerCommands();
        } catch (error) {
          console.error('Error registering commands:', error.message);
        }

        try {
          groupListener(sock,groupCache)
          messageListener(sock);
        } catch (error) {
          console.error('Error in message listener:', error.message);
        }

process.on('uncaughtException',(error)=>{
  console.log('we got this error',error)
})

        try {
          require('./console');
        } catch (error) {
          console.error('Error loading console module:', error.message);
        }
      } catch (error) {
        console.error('Unexpected error in connect function:', error.message);
        process.exit(1);
      }
    }

    await connect();
  } catch (error) {
    console.error('Fatal error in connection logic:', error.message);
    process.exit(1);
  }
}

module.exports = connectionLogic;