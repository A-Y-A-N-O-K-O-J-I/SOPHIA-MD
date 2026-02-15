# SOPHIA-MD Unified Pairing System

## Overview
This is a complete unified WhatsApp bot pairing and connection system. Once paired, the bot automatically starts running with full functionality - no split logic, no separate processes.

## Architecture

### Core Files

1. **botState.js** - Manages pairing state in `bot-state.json`
2. **connectionLogic.js** - Handles bot connection, reconnection, and all bot functionality
3. **pair.js** - Pairing code endpoint
4. **qr.js** - QR code pairing endpoint
5. **index.js** - Main server with auto-connection on startup
6. **index.html** - Frontend UI with dynamic pairing status

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    SERVER STARTUP                        │
│                                                          │
│  1. Initialize bot-state.json                           │
│  2. Check if bot was previously paired                  │
│  3. If paired → Auto-connect and start bot              │
│  4. If not paired → Wait for pairing request            │
└─────────────────────────────────────────────────────────┘
                            │
                            ├─────────── NOT PAIRED
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   PAIRING PROCESS                        │
│                                                          │
│  User visits /pair?number=XXX or /qr                    │
│  ├─ Generate pairing code/QR                            │
│  ├─ User scans/enters code in WhatsApp                  │
│  ├─ Connection established                              │
│  ├─ Send restart message to WhatsApp                    │
│  ├─ Mark as paired in bot-state.json ✅                 │
│  └─ Bot starts running immediately                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│                     BOT RUNNING                          │
│                                                          │
│  • All commands active                                  │
│  • Message listeners active                             │
│  • Group listeners active                               │
│  • Anti-link/tag detection active                       │
│  • Auto-reconnect on disconnection                      │
│  • Logout detection → Clear session → unpair            │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
project/
├── index.js                 # Main server with auto-connect
├── botState.js             # State management module
├── connectionLogic.js      # Unified bot connection logic
├── pair.js                 # Pairing code endpoint
├── qr.js                   # QR code endpoint
├── bot-state.json          # Auto-generated state file
├── sessions.db             # SQLite session storage
├── public/
│   └── index.html          # Frontend UI
└── lib/
    ├── antilink2.js
    ├── antitag2.js
    ├── CommandRegistry.js
    ├── listener.js
    ├── restartMessage.js
    └── console.js
```

## bot-state.json Structure

```json
{
  "paired": false,
  "sessionId": "SOPHIA_MD_SESSION",
  "phoneNumber": null,
  "lastConnected": null
}
```

### States:
- **paired: false** - Bot not paired, awaiting pairing
- **paired: true** - Bot paired and should auto-connect on restart

## API Endpoints

### GET /status
Returns current bot pairing status
```json
{
  "paired": true,
  "phoneNumber": "1234567890",
  "lastConnected": "2024-01-15T10:30:00.000Z"
}
```

### GET /pair?number=XXXXX
Generates pairing code for phone number
- **Rejects if already paired**
- Returns pairing code
- Auto-starts bot after successful pairing

### GET /qr
Generates QR code image
- **Rejects if already paired**
- Returns PNG image
- Auto-starts bot after successful pairing

## Frontend Features

### Not Paired State
- Shows pairing options
- Toggle between pairing code and QR methods
- Input phone number for pairing code
- Live status polling after pairing initiated

### Paired State
- Shows "Bot Connected!" message
- Displays social links (WhatsApp Channel & X)
- No pairing options visible

## Key Features

### 1. Single Session Per Deployment
- Fixed session ID: `SOPHIA_MD_SESSION`
- One bot instance per server
- No UUID generation needed

### 2. Auto-Connection on Restart
- Server checks `bot-state.json` on startup
- If `paired: true`, automatically reconnects
- Full bot functionality restored

### 3. Pairing Protection
- `/pair` and `/qr` reject requests if already paired
- Prevents accidental re-pairing
- Must manually unpair first

### 4. Logout Detection
- Detects `DisconnectReason.loggedOut`
- Automatically clears session files
- Updates `bot-state.json` to `paired: false`
- Bot stops running

### 5. Unified Connection Logic
- No split between pairing and running
- Same connection logic for all scenarios
- Consistent retry and reconnection behavior

### 6. Restart Message as Pairing Confirmation
- Pairing marked complete ONLY after restart message sent
- Ensures full initialization before marking as paired
- Prevents premature pairing status

## Flow Diagrams

### Initial Pairing Flow
```
User → /pair?number=XXX
  ↓
Check if already paired
  ↓ (not paired)
Generate pairing code
  ↓
Return code to user
  ↓
User enters code in WhatsApp
  ↓
Connection opens
  ↓
Send restart message
  ↓
Mark as paired ✅
  ↓
Initialize all bot features
  ↓
Bot running!
```

### Server Restart Flow
```
Server starts
  ↓
Initialize bot-state.json
  ↓
Check pairing status
  ↓
paired: true?
  ↓ (yes)
Load session from sessions.db
  ↓
Connect to WhatsApp
  ↓
Send restart message
  ↓
Initialize all bot features
  ↓
Bot running!
```

### Logout Flow
```
User logs out from WhatsApp
  ↓
Bot detects DisconnectReason.loggedOut
  ↓
Delete sessions.db
  ↓
Update bot-state.json → paired: false
  ↓
Stop bot
  ↓
Ready for new pairing
```

## Environment Variables

```env
# Proxy settings (optional)
CHANGE_WEB=false
WA_PROXY_URL=https://proxy-test-zgtr.onrender.com

# Server port
PORT=5000
```

## Installation

```bash
# Install dependencies
npm install

# Start server
npm start
```

## Usage

### For Users

1. **First Time Setup:**
   - Visit the web interface
   - Choose pairing method (code or QR)
   - Complete pairing
   - Bot starts automatically

2. **After Server Restart:**
   - Bot automatically reconnects
   - No action needed
   - Visit web interface to confirm status

3. **To Unpair:**
   - Log out from WhatsApp linked devices
   - Bot automatically detects and unpairs
   - Ready for new pairing

### For Developers

**Check pairing status:**
```javascript
const { isPaired, getBotState } = require('./botState');

if (isPaired()) {
  console.log('Bot is paired');
}
```

**Start bot manually:**
```javascript
const { startBot } = require('./connectionLogic');
await startBot(phoneNumber);
```

**Update bot state:**
```javascript
const { markAsPaired, markAsUnpaired } = require('./botState');

// Mark as paired
markAsPaired('1234567890');

// Mark as unpaired
markAsUnpaired();
```

## Error Handling

### Connection Errors
- **badSession**: Retries twice, then resets session
- **loggedOut**: Clears session and marks as unpaired
- **timedOut**: Auto-reconnects
- **connectionClosed**: Retries up to 3 times

### Pairing Errors
- Already paired: Returns error, rejects request
- Invalid phone number: Returns error message
- Connection failed: Returns error, allows retry

## Social Links

After successful pairing, users are encouraged to follow:
- **WhatsApp Channel**: https://whatsapp.com/channel/0029VasFQjXICVfoEId0lq0Q
- **X (Twitter)**: https://x.com/AyanokojiWebDev

## Troubleshooting

### Bot won't connect after restart
- Check if `bot-state.json` has `paired: true`
- Check if `sessions.db` exists
- Check server logs for errors

### Pairing code doesn't work
- Ensure phone number is correct format
- Check if bot is already paired
- Try QR code method instead

### Bot disconnects frequently
- Check internet connection
- Check proxy settings if enabled
- Review connection logs

### "Already paired" error
- Bot is already connected
- Check web interface for status
- Logout from WhatsApp if you want to re-pair

## License
MIT

## Credits
Maintained by AYANOKOJI KIETAKA (AYANOKOJI TECH)