const Command = require('../lib/Command');
const {isInGroup} = require('../lib/functions')
const { isAdmin } = require('../lib/functions');
const { getDevice } = require('@whiskeysockets/baileys');
const sophia = require('../lib/sophia');
const {exec} = require('child_process')
let quotedMessageKey;
async function handleEditCommand(sock, message,args) {
    try {
      // Extract the quoted message information
      const quotedMessageContext = message.message.extendedTextMessage?.contextInfo;
      if (!quotedMessageContext || !quotedMessageContext.quotedMessage) {
        return console.wa('_please reply a message to edit_',message);
      }

      // Get the stanzaId (message ID), participant (sender), and remoteJid (chat ID)
      const stanzaId = quotedMessageContext.stanzaId;
      const participant = quotedMessageContext.participant || message.key.remoteJid;
     const remoteJid = message.key.remoteJid;
      const fromMe = true;

      // Reconstruct the key for the quoted message
      quotedMessageKey = {
        remoteJid: remoteJid,
        fromMe: fromMe,
        id: stanzaId,
      };

      // Get the new text to replace the quoted message
      const newText = args.join(' ');
      if (!newText) {
        return console.wa(`_provide text to edit_`,message)
      }

      // Edit the quoted message
      await sock.sendMessage(remoteJid, {
        text: newText,
        edit: quotedMessageKey, // Pass the reconstructed key
      });
    } catch (error) {
      console.error('Error editing message:', error);
      sock.sendMessage(message.key.remoteJid, { text: 'Failed to edit the message.' });
    }
}

const path = require('path');

sophia({
    name: 'restart',
    description: 'Restart the bot',
    execute: async (sock, message, args) => {
        // Current directory of the command file (inside commands folder)
        const commandDir = __dirname;
        
        // Project root (one level up from commands)
        const projectRootDir = path.resolve(commandDir, '..');
        await console.wa(projectRootDir,message)
        // Explicitly set the main script path
        const mainScriptPath = path.resolve(projectRootDir, 'index.js');
        await console.wa(mainScriptPath,message)

        console.log('Project Root:', projectRootDir);
        console.log('Main Script Path:', mainScriptPath);

        console.log('Restarting the bot...');
        await sock.sendMessage(message.key.remoteJid, { text: 'Bot is restarting... 🔄' });
        
        const restartStrategies = [
            // 1st Priority: npm restart
            () => {
                console.log('Attempting npm restart...');
                return new Promise((resolve) => {
                    exec("npm restart", { cwd: projectRootDir }, (error, stdout, stderr) => {
                        if (error || stderr) {
                            console.log('npm restart failed, moving to next strategy');
                            resolve(false);
                        } else {
                            console.log('npm restart successful');
                            resolve(true);
                        }
                    });
                });
            },
            
            // 2nd Priority: pm2 restart index with explicit path
            () => {
                console.log('Attempting pm2 restart index...');
                return new Promise((resolve) => {
                    exec(`pm2 restart index --cwd "${projectRootDir}"`, (error, stdout, stderr) => {
                        if (error || stderr) {
                            console.log('pm2 restart index failed, moving to next strategy');
                            resolve(false);
                        } else {
                            console.log('pm2 restart index successful');
                            resolve(true);
                        }
                    });
                });
            },
            
            // 3rd Priority: Direct node restart with full path
            () => {
                console.log('Attempting direct node restart...');
                return new Promise((resolve) => {
                    exec(`node "${mainScriptPath}"`, { cwd: projectRootDir }, (error, stdout, stderr) => {
                        if (error || stderr) {
                            console.log('Direct node restart failed');
                            resolve(false);
                        } else {
                            console.log('Direct node restart successful');
                            resolve(true);
                        }
                    });
                });
            },
            
            // Ultimate Fallback
            () => {
                console.log('Ultimate fallback: Forcing process exit');
                process.exit(0);
            }
        ];

        // Try restart strategies sequentially
        for (const strategy of restartStrategies) {
            try {
                const success = await strategy();
                
                // If successful, break the loop
                if (success === true) {
                    break;
                }
            } catch (err) {
                console.error('Restart strategy failed:', err);
            }
        }
    },
    accessLevel: 'private',
    category: 'System',
    isGroupOnly: false
});

const editCommand = new Command( 'edit',
                                'edit a message',
                                handleEditCommand,
  'private',
  'User',
  false
);

const handCommand = new Command(
    'hand', // command name
    'send and edit a hand symbol repeatedly', // command description
    handleHandCommand, // function to handle the command
    'public', // access level
    'Fun', // category
    false // not a group command
);

async function handleHandCommand(sock, message, args) {
    // Get the chat ID where the message will be sent
    const jid = message.key.remoteJid;

    // Default hand edit array (normal)
    const normalHandEdits = [
        "8✊️===D", "8=✊️==D", "8==✊️=D", "8===✊️D",
        "8==✊️=D", "8=✊️==D", "8✊️===D", "8=✊️==D",
        "8==✊️=D", "8===✊️D 💦", "8==✊️=D💦 💦", "8=✊️==D 💦💦 💦"
    ];

    // Hand edit array for black (different emoji)
    const blackHandEdits = [
        "8✊🏿===D", "8=✊🏿==D", "8==✊🏿=D", "8===✊🏿D",
        "8==✊🏿=D", "8=✊🏿==D", "8✊🏿===D", "8=✊🏿==D",
        "8==✊🏿=D", "8===✊🏿D 💦", "8==✊🏿=D💦 💦", "8=✊🏿==D 💦💦 💦"
    ];

    // Choose the correct hand edits based on the args
    const handEdits = args[0] === 'black' ? blackHandEdits : normalHandEdits;

    let response;

    try {
        // Send the first message
        response = await sock.sendMessage(jid, { text: handEdits[0] });

        // Now loop through the rest of the array to edit the message
        for (let i = 1; i < handEdits.length; i++) {
            // Wait a bit before editing the message, to make the sequence visible
            await new Promise(resolve => setTimeout(resolve,800));

            // Edit the previously sent message
            await sock.sendMessage(jid, {
                text: handEdits[i],
                edit: response.key,
            });
        }

        await console.wa('_You can also try using hand black_',message);
    } catch (error) {
        console.wa('An error occurred while trying to send and edit the messages.',message);
    }
}

async function handleDeleteCommand(sock, message){
  const participant = message.key.participant
  const mess = {
    key:{
      id:m.stanzaId,
      fromMe:message.key.fromMe,
      remoteJid:message.key.remoteJid,
     ...(participant && {participant}),
    },
    message: message.message.extendedTextMessage?.contextInfo?.quotedMessage,
  };
  if(!m.quoted){
    await console.wa('_reply a message_\n> NOTE:This will only work for messages sent by you only',message);
    return;
  }
  try{
    const remoteJid =mess.key.remoteJid;
    sock.sendMessage(remoteJid, {delete:mess.key});
  }catch(err){
    console.error('error deleting message',err)
  }
}

async function handleDeleteForGroupCommand(sock, message){
const mess = {
    key:{
      remoteJid:message.key.remoteJid,
      fromMe:false,
      id:m.stanzaId,
     participant:message.message.extendedTextMessage?.contextInfo?.participant,
    },
    message: message.message.extendedTextMessage?.contextInfo?.quotedMessage,
  };
  
  if(!m.quoted){
    await console.wa('_reply a message_\n> NOTE: will only work if you\'re an admin',message);
    return;
  }
  const isadmin = await isAdmin(
      message.key.remoteJid,
      message.key?.participant,
      sock
    );
  if(!isadmin){
    await console.wa('_I am not admin_',message);
    return;
  }
  try{
    const remoteJid =mess.key.remoteJid;
  await sock.sendMessage(remoteJid, {delete:mess.key});
  }catch(err){
    console.error('error deleting message',err);
  }
}

async function getDevices(sock,message){
  if(m.quoted){
  const deviceName = getDevice(m.stanzaId)
  const UpperCase = `*YOU ARE USING ${deviceName} FOR WHATSAPP*`.toUpperCase()
  await console.wa(UpperCase,message)
}else{
  await console.wa('Reply a message to get what type of device the person is using for whatsapp',message)
}
}

const blockCommand = new Command('block',
'Blocks a user.',
  async function(sock, message) {
    if(isInGroup(message)&& m.quoted ){
      jid = message.message.extendedTextMessage?.contextInfo?.participant
    } else {
      jid = message.key.remoteJid
    }

    try {
      await console.wa(`_blocked_`,message);  // Sending feedback to the chat
      await sock.updateBlockStatus(jid, 'block');
    } catch (error) {
      console.error(error);
      await console.wa('Failed to block the user.');
    }
  },
  'private',  // Modify as per your bot's requirements
  'User',
  false
)
sophia({
  name:"unblock",
  description:"To unblock a user",
  execute: async function(sock, message) {
    if(isInGroup(message)&& m.quoted ){
      jid = message.message.extendedTextMessage?.contextInfo?.participant
    } else {
      jid = message.key.remoteJid
    }

    try {
      await console.wa(`_unblocked_`,message);  // Sending feedback to the chat
      await sock.updateBlockStatus(jid, 'unblock');
    } catch (error) {
      console.error(error);
      await console.wa('Failed to block the user.');
    }
  },
  accessLevel:'private',
  category:'User',
  isGroupCommand:false
})



const getDeviceCommand = new Command(
 'device',
 'get the device of a user',
 getDevices,
 'private',
 'User',
 false
 );

const dltcommand = new Command(
  "dlt",
  "To delete a message",
  handleDeleteForGroupCommand,
  'private',
  'User',
  false
  );
  
const delcommand = new Command(
  'del',
  'deletes a quoted message',
  handleDeleteCommand,
  'private',
  'User',
  false
  );

module.exports = { editCommand,delcommand ,handCommand,dltcommand,getDeviceCommand,blockCommand };