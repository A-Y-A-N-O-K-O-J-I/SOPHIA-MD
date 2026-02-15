const QRCode = require("qrcode");
const makeWASocket = require("baileys").default;
const { delay, Browsers, DisconnectReason } = require("baileys");
const fs = require("fs");
const pino = require("pino");
const { useSQLiteAuthState } = require("./lib/auth");
const { Boom } = require("@hapi/boom");
const NodeCache = require("node-cache");
const { isPaired, markAsPaired, markAsUnpaired } = require("./lib/botState");
const { createSocket } = require("./connectionLogic");
const { setupLinkDetection } = require("./lib/antilink2");
const { registerCommands } = require("./lib/CommandRegistry");
const { messageListener, groupListener } = require("./lib/listener");
const sendRestartMessage = require("./lib/restartMessage");
const { setupTagDetection } = require("./lib/antitag2");

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

async function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      await fs.promises.rm(filePath, { recursive: true, force: true });
      console.log(`Successfully removed file: ${filePath}`);
    } catch (error) {
      console.error(`Error removing file: ${filePath}`, error);
    }
  }
}

async function generateQR(req, res) {
  // Check if bot is already paired
  if (isPaired()) {
    console.log("❌ QR generation rejected - Bot already paired");
    return res.status(400).json({
      error: "Bot already paired",
      message: "Bot is already connected. Please unpair first if you want to pair a new device.",
    });
  }

  console.log("📱 Generating QR code...");
  const sessionId = "SOPHIA_MD_SESSION";

  let responseSent = false;
  let retryCount = 0;
  let sessionRetryCount = 0;
  let restartMessageSent = false;
  const maxRetries = 3;
  const authDir = "./sessions.db";

  async function initializeQRSession() {
    const { state, saveState, clearSession } = useSQLiteAuthState(sessionId);
    console.log("✅ Authentication state initialized.");

    async function connect() {
      try {
         global.sock = await createSocket(state);
        console.log("✅ Socket created.");

        sock.ev.on("creds.update", saveState);

        sock.ev.on("connection.update", async (update) => {
          const { connection, lastDisconnect, qr } = update;
          console.log("🔄 QR Connection Update:", { connection, hasQR: !!qr, reason: lastDisconnect?.error?.output?.statusCode });

          // Send QR code if available
          if (qr && !responseSent) {
            try {
              console.log("📸 Serving QR code image");
              const qrBuffer = await QRCode.toBuffer(qr);
              res.writeHead(200, { "Content-Type": "image/png" });
              res.end(qrBuffer);
              responseSent = true;
              console.log("✅ QR code sent to client");
            } catch (error) {
              console.error("❌ Error sending QR code:", error);
            }
          }

          if (connection === "open") {
            console.log("✅ QR pairing connection opened! Starting bot...");
            retryCount = 0;
            sessionRetryCount = 0;

            if (!restartMessageSent) {
              console.log("📤 Sending restart message...");
              await delay(4000);
              await sendRestartMessage(sock);
              restartMessageSent = true;
              console.log("✅ Restart message sent!");

              // Mark as paired AFTER restart message
              markAsPaired(null); // No phone number for QR method
              console.log("🎉 Bot fully paired and operational!");
            }

            // Initialize all bot functionality
            console.log("🔧 Initializing bot features...");
            registerCommands();
            groupListener(sock, groupCache);
            messageListener(sock);
            setupLinkDetection(sock);
            setupTagDetection(sock);
            require("./lib/console");
            console.log("✅ All bot features initialized!");

          } else if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log("❌ QR connection closed with reason:", reason);

            if (reason === DisconnectReason.badSession) {
              console.warn(`⚠️ Session Error detected! Retrying... (${sessionRetryCount + 1}/2)`);
              sessionRetryCount++;
              if (sessionRetryCount < 2) {
                connect();
              } else {
                console.error("❌ Session error persisted. Resetting auth data...");
                fs.rmSync(authDir, { recursive: true, force: true });
                await initializeQRSession();
              }
            } else if (reason === DisconnectReason.loggedOut) {
              console.error("❌ Bot logged out. Deleting session...");
              await clearSession();
              markAsUnpaired(); // Mark as unpaired in bot-state.json
              if (!responseSent) {
                res.status(500).json({ error: "Logged Out" });
                responseSent = true;
              }
            } else if (reason === DisconnectReason.timedOut) {
              console.error("⏰ Timed out. Restarting connection...");
              await delay(5000);
              connect();
            } else if (reason === DisconnectReason.connectionClosed) {
              console.warn(`🔄 Connection closed. Reconnecting (${retryCount + 1}/${maxRetries})...`);
              await delay(5000);
              connect();
            } else if (reason === DisconnectReason.restartRequired) {
              console.log("[Server Restarting....!]");
              await initializeQRSession();
            } else {
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                await delay(10000);
                connect();
              } else {
                console.error("❌ Retry limit exceeded. Stopping...");
                if (!responseSent) {
                  res.status(500).json({ error: "Service Unavailable" });
                  responseSent = true;
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("❌ Error in QR connect function:", error);
        if (!responseSent) {
          res.status(500).json({ error: "Service Unavailable" });
          responseSent = true;
        }
      }
    }

    await connect();
  }

  await initializeQRSession();
}

module.exports = { generateQR };