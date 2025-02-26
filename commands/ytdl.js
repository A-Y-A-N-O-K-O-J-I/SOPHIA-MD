const sophia = require('sophia');
const {
ytsmp3,
ytsdlmp3,
ytdlmp3,
urlToBuffer,
reencodeAudio,
sendYouTubeAudio
} = require('../lib/youtube');
const react = require('react')
sophia({
  name:"play",
  description: "Download music on WhatsApp",
  execute: async function (sock, message, args){
    await react('p',message);
    if(!args)return;
   const output= args.join(' ');
    if(!output){
      await delay(2000);
      await react('e',message);
   await console.wa('_Please type .play then the song you want to play',message);
   return;
}
try{
   const song = await ytsmp3(output);
   await console.wa(`_downloading ${song.title}_`,message);
   await sendYouTubeAudio(sock,message,output);
}catch(error){
  await react('e',message)
  console.wa(`An error occurred ${error.message}`,message)
  console.error('An error occurred',error)
}
  },
  accessLevel:'private',
  category:'Media',
  isGroupOnly:false
})