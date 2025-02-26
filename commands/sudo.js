const sophia = require('sophia');
const { addSudo, removeSudo, isAlreadySudo} = require('../lib/sudo');
const { getSudoList} = require('../lib/commandHandler');
const { isInGroup } = require('../lib/functions')
sophia({
  name:'setsudo',
  description: 'give a person access to the bot',
  execute: async function (sock,message){
    const quotedParticipant = message.message.extendedTextMessage?.contextInfo?.participant
     const  mentionedPerson = message.message?.extendedTextMessage?.contextInfo?.mentionedJid[0]
    const sudoNumber = isInGroup(message) ? quotedParticipant || mentionedPerson || false : message.key.remoteJid
   if(!sudoNumber){
     await console.wa("_Please mention,reply or type .setsudo in pm_",message)
     return;
   }
    const formattedSudo = sudoNumber.split("@")[0];
    if(isAlreadySudo(formattedSudo)){
      await console.mention(`@${formattedSudo} was already in sudo`,sudoNumber,message)
      return;
    }
    addSudo(formattedSudo);
    await console.mention(`_@${formattedSudo} added to sudo_`,sudoNumber, message)
  },
  accessLevel:'private',
  category:'System',
  isGroupOnly:false
})
sophia({
  name:'delsudo',
  description: 'remove a person access to the bot',
  execute: async function (sock,message){
    const quotedParticipant = message.message.extendedTextMessage?.contextInfo?.participant
     const  mentionedPerson = message.message?.extendedTextMessage?.contextInfo?.mentionedJid[0]
    const sudoNumber = isInGroup(message) ? quotedParticipant || mentionedPerson || false : message.key.remoteJid
   if(!sudoNumber){
     await console.wa("_Please mention,reply or type .setsudo in pm_",message)
     return;
   }
    const formattedSudo = sudoNumber.split("@")[0];
    if(isAlreadySudo(formattedSudo)){
    removeSudo(formattedSudo);
    await console.mention(`_@${formattedSudo} removed from sudo_`,sudoNumber, message)
    } else{
      await console.mention(`@${formattedSudo} was not in sudo`,sudoNumber,message)
    }
  },
  accessLevel:'private',
  category:'System',
  isGroupOnly:false
})
sophia({
  name:'getsudo',
  description: 'gets people with access to the bot',
  execute: async function (sock,message){
    const sudoList = getSudoList()
    const checkedSudoList = sudoList.length > 0 ? sudoList.join(",") : "0"
    await console.wa(`Sudo numbers are: ${checkedSudoList}\nTotal ${sudoList.length}`,message)
  },
  accessLevel:'private',
  category:'System',
  isGroupOnly:false
   
})
