const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const axios = require("axios");
const path = require("path")
let dbPath = path.join(__dirname,".","database","chatHistory.json")

const db = new Low(new JSONFile(dbPath), { messages: [] });

async function gpt(userMessage) {
  try {
    await db.read(); // Load data from file
    db.data || { messages: [] }; // Ensure default structure

    const requestBody = {
      message: db.data.messages, // Send chat history
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

    await db.write(); // Save changes
    return botReply; // Return the bot's reply
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return null; 
  }
}




async function claude(query, userId) {
    try{
        const response = await axios.get(`https://bk9.fun/ai/Claude-Opus?q=${encodeURIComponent(query)}&userId=${userId}`);
        const res = response.data.BK9;
        return res;
    }catch(error){
        console.log(error)
        return error;
    }
}
module.exports = { gpt,claude}
