const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const {generateQR}  = require("./lib/qr");
const pairRouter = require("./lib/pair");
const {
  initializeState,
  getBotState,
  isPaired,
} = require("./lib/botState");
const apiRouter = require("./lib/apiRoutes"); // API routes for commands
const { startBot } = require("./lib/connectionLogic");
const config = require("./config");
require("dotenv").config();
require("./lib/mediaHelper");
require("module-alias/register");
if(fs.existsSync("./lib/database")){
  fs.mkdirSync("./lib/database")
}
process.once("uncaughtException", error => {
  console.log("we got this error", error);
});

process.once("unhandledRejection", error => {
  console.log("Unhandled rejection:", error);
});

async function sendRequest() {
  try{
  if(config.RENDER){
  // Clear the previous interval to avoid overlapping executions
  clearInterval(interval);

  
await axios.get(config.RENDER_URL);
 // console.log(JSON.stringify(res.data,null,2))

  interval = setInterval(sendRequest, 5000);
} 
  } catch (error) {
    console.error('Error sending request:', error);
  }
}
interval = setInterval(sendRequest, 5000);

const app = express();

app.use(
  cors({
    origin: ["https://sophia-md-pair.vercel.app", "http://localhost:3000"],
    methods: ["GET"],
    optionsSuccessStatus: 200,
  }),
);

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files (like video, images, etc.) from the public folder
app.use(express.static("public"));

// Initialize bot state
initializeState();

// Check if bot is paired and auto-connect on startup
async function initializeBot() {
  console.log("🔍 Checking bot pairing status...");
  
  if (isPaired()) {
    console.log("✅ Bot was previously paired. Auto-connecting...");
    try {
      await startBot();
      console.log("🎉 Bot reconnected successfully!");
    } catch (error) {
      console.error("❌ Failed to reconnect bot:", error);
    }
  } else {
    console.log("⚠️ Bot not paired. Waiting for pairing request...");
  }
}

// Route to check pairing status (for frontend)
app.get("/status", (req, res) => {
  const state = getBotState();
  res.json({
    paired: state.paired,
    lastConnected: state.lastConnected,
    phoneNumber: state.phoneNumber,
  });
});

app.use("/api", apiRouter)
// Route to generate QR code
app.get("/qr", generateQR);

// Use the pairRouter for handling pairing code generation at /pair route
app.use("/pair", pairRouter);

// Serve the main page with pairing status check
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize bot after server starts
  await initializeBot();
});