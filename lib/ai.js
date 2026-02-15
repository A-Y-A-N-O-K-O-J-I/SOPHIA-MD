const path = require("path");
const axios = require("axios");

async function loadLowDB() {
  const { Low } = await import("lowdb");
  const { JSONFile } = await import("lowdb/node");
  return { Low, JSONFile };
}

let dbPath = path.join(__dirname, ".", "database", "chatHistory.json");

async function gpt(userMessage) {
  try {
    const { Low, JSONFile } = await loadLowDB(); // Load modules dynamically
    const db = new Low(new JSONFile(dbPath), { messages: [] });

    await db.read(); // Load data from file
    db.data ||= { messages: [] }; // Ensure default structure

    const requestBody = {
      message: db.data.messages,
      query: userMessage,
      model: "gpt-4",
    };

    const response = await axios.post(
      "https://itzpire.com/ai/chat-gpt",
      requestBody,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const botReply = response.data.result || "I don't understand.";

    // Save chat history
    db.data.messages.push({ role: "user", content: userMessage });
    db.data.messages.push({ role: "assistant", content: botReply });

    await db.write();
    return botReply;
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return null;
  }
}

async function claude(query, userId) {
  try {
    const response = await axios.get(
      `https://bk9.fun/ai/Claude-Opus?q=${encodeURIComponent(query)}&userId=${userId}`
    );
    return response.data.BK9;
  } catch (error) {
    console.log(error);
    return error;
  }
}

module.exports = { gpt, claude };