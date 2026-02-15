//I hate coding
const express = require("express");
const pino = require("pino");
const fs = require("fs");
const { Boom } = require("@hapi/boom");
const router = express.Router();
const { useSQLiteAuthState } = require("./auth");
const { delay, Browsers, DisconnectReason } = require("baileys");
const makeWASocket = require("baileys").default;
const NodeCache = require("node-cache");
const { isPaired, markAsPaired, markAsUnpaired } = require("./botState");
const { createSocket } = require("./connectionLogic");
const { setupLinkDetection } = require("./antilink2");
const { registerCommands } = require("./CommandRegistry");
const { messageListener, groupListener } = require("./listener");
const sendRestartMessage = require("./restartMessage");
const { setupTagDetection } = require("./antitag2");

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

router.get("/", async (req, res) => {
  // Check if bot is already paired
  if (isPaired()) {
    console.log("❌ Pairing rejected - Bot already paired");
    return res.status(400).json({
      error: "Bot already paired",
      message: "Bot is already connected. Please unpair first if you want to pair a new device.",
    });
  }

  console.log("🔗 Generating pairing code...");
  const sessionId = "SOPHIA_MD_SESSION";

  let num = req.query.number;

  if (!num) {
    return res.status(400).json({
      message: "Number query parameter required",
      example: "/pair?number=1234567890",
    });
  }

  let retryCount = 0;
  let sessionRetryCount = 0;
  let restartMessageSent = false;
  let pairingCodeGenerated = false; // Flag to track if code was generated
  const maxRetries = 3;
  const authDir = "./sessions.db";

  async function initializePairingSession() {
    const { state, saveState, clearSession } = useSQLiteAuthState(sessionId);
    console.log("✅ Authentication state initialized.");

    async function connect() {
      sock = await createSocket(state);
      console.log("✅ Socket created.");

      // ONLY generate pairing code if not already generated
      if (!sock.authState.creds.registered && !pairingCodeGenerated) {
        console.log("📱 Requesting pairing code...");
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        
        try {
          const code = await sock.requestPairingCode(num);
          console.log(`✅ Pairing code generated: ${code}`);
          pairingCodeGenerated = true; // Mark as generated

          if (!res.headersSent) {
            res.json({
              code: code,
              message: "Pairing code generated. Enter it on your WhatsApp to connect.",
              phoneNumber: num,
            });
          }
        } catch (error) {
          console.error("❌ Error generating pairing code:", error);
          if (!res.headersSent) {
            res.status(500).json({
              error: "Failed to generate pairing code",
              message: "Please try again. If this persists, check your internet connection.",
              details: error.message
            });
          }
          // Clean up and stop
          sock.ev.removeAllListeners();
          return;
        }
      } else if (!sock.authState.creds.registered && pairingCodeGenerated) {
        // Code already generated, just waiting for user to enter it
        console.log("⏳ Waiting for user to enter pairing code...");
      }

      sock.ev.on("creds.update", saveState);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        console.log("🔄 Pairing Connection Update:", { connection, reason: lastDisconnect?.error?.output?.statusCode });

        try {
          if (connection === "open") {
            console.log("✅ Pairing connection opened! Starting bot...");
            retryCount = 0;
            sessionRetryCount = 0;

            if (!restartMessageSent) {
              console.log("📤 Sending restart message...");
              await delay(4000);
              await sendRestartMessage(sock);
              restartMessageSent = true;
              console.log("✅ Restart message sent!");

              // Mark as paired AFTER restart message
              markAsPaired(num);
              console.log("🎉 Bot fully paired and operational!");
            }

            // Initialize all bot functionality
            console.log("🔧 Initializing bot features...");
            registerCommands();
            groupListener(sock, groupCache);
            messageListener(sock);
            setupLinkDetection(sock);
            setupTagDetection(sock);
            require("./console");
            console.log("✅ All bot features initialized!");

          } else if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log("❌ Connection closed with reason:", reason);

            // Error 428 or similar - likely rate limit or network issue
            if (reason === 428 || reason === 408 || reason === 500) {
              console.error(`❌ Server error (${reason}). User should retry the request.`);
              if (!res.headersSent) {
                res.status(500).json({
                  error: `Server error (${reason})`,
                  message: "Please refresh the page and try generating a new pairing code.",
                  retry: true
                });
              }
              // Clean up and stop trying
              sock.ev.removeAllListeners();
              return;
            }

            if (reason === DisconnectReason.badSession) {
              console.warn(`⚠️ Session Error detected! Retrying... (${sessionRetryCount + 1}/2)`);
              sessionRetryCount++;
              if (sessionRetryCount < 2) {
                connect();
              } else {
                console.error("❌ Session error persisted. Resetting auth data...");
                fs.rmSync(authDir, { recursive: true, force: true });
                if (!res.headersSent) {
                  res.status(500).json({
                    error: "Session error persisted",
                    message: "Please refresh and try again with a new pairing code."
                  });
                }
              }
            } else if (reason === DisconnectReason.loggedOut) {
              console.error("❌ Bot logged out. Deleting session...");
              await clearSession();
              markAsUnpaired();
              if (!res.headersSent) {
                res.status(400).json({
                  error: "Logged out",
                  message: "The pairing was cancelled or logged out."
                });
              }
            } else if (reason === DisconnectReason.timedOut) {
              console.error("⏰ Timed out. Reconnecting...");
              await delay(5000);
              connect();
            } else if (reason === DisconnectReason.connectionClosed) {
              // Only retry connectionClosed AFTER pairing code was already generated
              if (pairingCodeGenerated) {
                console.warn(`🔄 Connection closed. Reconnecting (${retryCount + 1}/${maxRetries})...`);
                await delay(5000);
                connect();
              } else {
                console.error("❌ Connection closed before pairing code generated");
                if (!res.headersSent) {
                  res.status(500).json({
                    error: "Connection failed",
                    message: "Please try again."
                  });
                }
              }
            } else if (reason === DisconnectReason.restartRequired) {
              console.log("[Server Restarting....!]");
              await initializePairingSession();
            } else {
              // Generic error handling
              if (retryCount < maxRetries && pairingCodeGenerated) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                await delay(10000);
                connect();
              } else {
                console.error("❌ Retry limit exceeded or pairing failed.");
                if (!res.headersSent) {
                  res.status(500).json({
                    error: "Connection failed",
                    message: "Please refresh and try again with a new pairing code."
                  });
                }
              }
            }
          }
        } catch (error) {
          console.error("❌ Error during connection process:", error);
          if (!res.headersSent) {
            res.status(500).json({
              error: "Service error",
              message: "An unexpected error occurred. Please try again."
            });
          }
        }
      });
    }

    await connect();
  }

  try {
    await initializePairingSession();
  } catch (error) {
    console.error("❌ Initialization error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Initialization failed",
        message: "Please try again.",
        details: error.message
      });
    }
  }
});

module.exports = router;