const Command = require('../lib/sophia');
const axios = require("axios")
Command({
  name:'waifu',
  description:'Sends a random waifu image from waifu.pics',
 execute: waifuCommandFunction,
 accessLevel: 'private',
 category: 'Fun',
 group: false                                        
});

// Function to fetch and send the waifu image
async function waifuCommandFunction(sock, message) { // Make sure you have axios installed to make API calls
  
  try {
    // Fetch the waifu image URL
    const response = await axios.get('https://api.waifu.pics/sfw/waifu');
    const imageUrl = response.data.url;

    // Send the image to the user
    await sock.sendMessage(message.key.remoteJid, { 
      image: { url: imageUrl },
      caption: "Here's a random waifu for you!" 
    });
  } catch (error) {
    console.error('Error fetching waifu image:', error);
    await sock.sendMessage(message.key.remoteJid, { text: "Sorry, I couldn't fetch a waifu image at the moment." });
  }
}

async function handleWebSsCommand(sock,m,args){
  const input = args[0] || m.quoted?.conversation || m.quoted?.extendedTextMessage.text
  if(!input){
  await console.wa('Please add a url to screenshot like .webss <url>',m);
return;
}

try{
  const response = await axios.get('https://bk9.fun/tools/screenshot', {
  responseType: 'arraybuffer',  // Request image as array buffer
  params: {
    url: input,
    device: 'phone',
  },
});
const buffer = Buffer.from(response.data);
await console.waMedia.sendImage(buffer,"> Here you Go!",m)

}catch(error){
  console.error("webss error",error)
  await console.wa(`An error occurred: ${error.message}`,m)
}
}
Command({
 name: 'webss',
description:  'screenshot of a website',
execute:  handleWebSsCommand,
accessLevel:  'public',
 category: 'Utility',
isGroupCommand:  false
  });


