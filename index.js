const {handlerPrefix} = require('./lib/listener')
const config = require('./config')
const express = require('express');
const connectionLogic = require('./lib/connect');
const path = require('path');
const {existsSync} = require('fs');
const configPath = path.join(__dirname, './config.env');
if (existsSync(configPath)) require('dotenv').config({ path: configPath,override:true });
global.startTime = Date.now();
require('./lib/mediaHelper');
require('module-alias/register');

// Create and start the Express server
const app = express();

// Home page route
app.get('/', (req, res) => {
  res.send('<h1>WhatsApp Bot is Running!</h1>');
});

const axios = require('axios');

let interval;

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

// Server status route 
app.get('/status', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running smoothly!' });
});

// Start the server
const PORT = config.PORT || 8005;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log(`The prefix is ${handlerPrefix}`)
connectionLogic();
