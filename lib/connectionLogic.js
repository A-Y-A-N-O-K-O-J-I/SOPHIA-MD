//Future segun: We hate coding
const {
  Browsers,
  DisconnectReason,
} = require("baileys");
const makeWASocket = require("baileys").default;
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const { useSQLiteAuthState } = require("./auth");
const { setupLinkDetection } = require("./antilink2");
const { registerCommands } = require("./CommandRegistry");
const { messageListener, groupListener } = require("./listener");
const sendRestartMessage = require("./restartMessage");
const config = require("../config");
const { delay } = require("baileys");
const NodeCache = require("node-cache");
const { setupTagDetection } = require("./antitag2");
const { markAsPaired, markAsUnpaired } = require("./botState");

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

let globalSock = null; // Store the active socket globally

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

async function createSocket(state) {
  let sock;

  if (process.env.CHANGE_WEB === "true") {
    const {
      default: nodeFetch,
      Request,
      Response,
      Headers,
    } = await import("node-fetch");
    const axiosModule = await import("axios");
    const axios = axiosModule.default;

    const WA_PROXY_BASE =
      process.env.WA_PROXY_URL || "https://proxy-test-zgtr.onrender.com";

    global.fetch = async (targetUrl, options = {}) => {
      try {
        const host = new URL(targetUrl).hostname;
        const whatsappDomains = [
          "mmg.whatsapp.net",
          "pps.whatsapp.net",
          "media.whatsapp.net",
          "cdn.whatsapp.net",
          "web.whatsapp.com",
        ];
        const useProxy = whatsappDomains.some((d) => host.includes(d));

        if (!useProxy) {
          return nodeFetch(targetUrl, options);
        }

        const proxyUrl = `${WA_PROXY_BASE}/proxy?url=${encodeURIComponent(targetUrl)}`;
        const proxyHeaders = {
          ...(options.headers || {}),
          "x-wa-proxy-key": "NEXUS",
        };
        return nodeFetch(proxyUrl, { ...options, headers: proxyHeaders });
      } catch (e) {
        console.error("[fetch proxy error]", e);
        return nodeFetch(targetUrl, options);
      }
    };

    global.Request = Request;
    global.Response = Response;
    global.Headers = Headers;

    axios.interceptors.request.use(
      (cfg) => {
        try {
          if (!cfg.url) return cfg;
          const urlObj = new URL(cfg.url);
          const host = urlObj.hostname;
          const whatsappDomains = [
            "mmg.whatsapp.net",
            "pps.whatsapp.net",
            "media.whatsapp.net",
            "cdn.whatsapp.net",
            "web.whatsapp.com",
          ];
          const useProxy = whatsappDomains.some((d) => host.includes(d));
          if (useProxy) {
            const proxyUrl = `${WA_PROXY_BASE}/proxy?url=${encodeURIComponent(cfg.url)}`;
            cfg.url = proxyUrl;
            cfg.baseURL = undefined;
            cfg.headers = {
              ...(cfg.headers || {}),
              "x-wa-proxy-key": "NEXUS",
            };
            delete cfg.httpAgent;
            delete cfg.httpsAgent;
          }
        } catch (err) {
          console.warn("axios proxy rewrite failed", err.message);
        }
        return cfg;
      },
      (e) => Promise.reject(e),
    );

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Safari"),
      version: [2, 3000, 1028442591],
      syncFullHistory: false,
      cachedGroupMetadata: async (jid) => groupCache.get(jid),
      generateHighQualityLinkPreview: true,
      waWebSocketUrl: "wss://proxy-test-zgtr.onrender.com/wa-proxy",
      markOnlineOnConnect: false,
    });
  } else {
    sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: Browsers.macOS("Safari"),
      version: [2, 3000, 1028442591],
      syncFullHistory: false,
      cachedGroupMetadata: async (jid) => groupCache.get(jid),
      generateHighQualityLinkPreview: true,
      markOnlineOnConnect: false,
    });
  }

  return sock;
}

async function startBot(phoneNumber = null) {
  const sessionId = "SOPHIA_MD_SESSION";
  const authDir = "./sessions.db";
  let retryCount = 0;
  let sessionRetryCount = 0;
  let restartMessageSent = false;
  const maxRetries = 3;

  console.log("🤖 Starting bot...");

  if (!fs.existsSync("./lib/database")) {
    fs.mkdirSync("./lib/database", { recursive: true });
  }

  async function connect() {
    try {
      const { state, saveState, clearSession } = useSQLiteAuthState(sessionId);
      global.sock = await createSocket(state);
      
      // Store globally
      globalSock = sock;

      sock.ev.on("creds.update", saveState);

      sock.ev.on("connection.update", async (update) => {
        try {
          const { connection, lastDisconnect } = update;
          console.log("🔄 Connection Update:", { connection, reason: lastDisconnect?.error?.output?.statusCode });

          if (connection === "open") {
            console.log("✅ Bot connected and running!");
            retryCount = 0;
            sessionRetryCount = 0;

            // Send restart message first
            if (!restartMessageSent) {
              console.log("📤 Sending restart message...");
              await delay(4000);
              await sendRestartMessage(sock);
              restartMessageSent = true;
              console.log("✅ Restart message sent!");

              // ONLY mark as paired AFTER restart message is sent
              markAsPaired(phoneNumber);
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

            if (reason === DisconnectReason.badSession) {
              console.warn(
                `⚠️ Session Error detected! Retrying... (${sessionRetryCount + 1}/2)`,
              );
              sessionRetryCount++;
              if (sessionRetryCount < 2) {
                await delay(5000);
                connect();
              } else {
                console.error("❌ Session error persisted. Resetting...");
                clearSession()
                markAsUnpaired();
                globalSock = null;
              }
            } else if (reason === DisconnectReason.loggedOut) {
              console.error("❌ Bot logged out. Clearing session...");
              clearSession()
              markAsUnpaired();
              globalSock = null;
            } else if (reason === DisconnectReason.timedOut) {
              console.error("⏰ Timed out. Reconnecting...");
              await delay(5000);
              connect();
            } else if (reason === DisconnectReason.multideviceMismatch) {
              console.error("⚠️ Multidevice mismatch. Reconnecting...");
              connect();
            } else if (reason === DisconnectReason.restartRequired) {
              console.log("🔄 Server restart required. Reconnecting...");
              connect();
            } else if (reason === DisconnectReason.connectionClosed) {
              console.warn(
                `🔄 Connection closed. Reconnecting (${retryCount + 1}/${maxRetries})...`,
              );
              await delay(5000);
              connect();
            } else if (reason === DisconnectReason.unavailableService) {
              console.warn(
                `⚠️ Service unavailable. Reconnecting (${retryCount + 1}/${maxRetries})...`,
              );
              await delay(5000);
              connect();
            } else {
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                await delay(10000);
                connect();
              } else {
                console.error("❌ Retry limit exceeded. Stopping...");
                globalSock = null;
              }
            }
          }
        } catch (error) {
          console.error("Error in connection update:", error.message);
        }
      });
    } catch (error) {
      console.error("Error in connect function:", error);
      globalSock = null;
    }
  }

  await connect();
}

function getActiveSock() {
  return globalSock;
}

module.exports = { startBot, createSocket, getActiveSock };