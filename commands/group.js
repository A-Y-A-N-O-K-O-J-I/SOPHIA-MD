const Command = require('../lib/Command');
const {isAdmin,decodeJid,parsedJid,isInGroup,delay} = require('../lib/functions');
const {isQuotedMessage, getQuotedInfo} = require('../lib/quotedMessageHandler');
const sophia = require('../lib/sophia');
const { enableLinkDetection, disableLinkDetection } = require('../lib/antilink');
sophia({
  name:"mute",
  description:"To mute a group",
  execute: async function (sock,message){
    if(!isInGroup(message)){
      await console.wa('_This is for groups only_',message)
      return;
    }
    const isadmin = await isAdmin(
     message.key.remoteJid,
     message.key?.participant,
     sock
     )
    if(!isadmin){
      await console.wa('_I am not admin_',message)
      return;
    }
    try{
   const jid = message.key.remoteJid;
await sock.groupSettingUpdate(jid, 'announcement')
await console.wa('_muted_',message)
    }catch(e){
      console.error('error',e);
      await console.wa(e.message,message)
    }
  },
  accessLevel:'private',
  category: 'Group',
  isGroupOnly:true
})

sophia({
  name:"unmute",
  description:"To unmute a group",
  execute: async function (sock,message){
      if(!isInGroup(message)){
      await console.wa('_This is for groups only_',message)
      return;
    }
    const isadmin = await  isAdmin(
     message.key.remoteJid,
     message.key?.participant,
     sock
     )
    if(!isadmin){
      await console.wa('_I am not admin_',message)
      return;
    }
    try{
   const jid = message.key.remoteJid;
await sock.groupSettingUpdate(jid, 'not_announcement')
    }catch(e){
      console.error('error',e);
      await console.wa(e.message,message)
    }
  },
  accessLevel:'private',
  category: 'Group',
  isGroupOnly:true
})

const tagAll = async (sock, message) => {
    if (!isInGroup(message)) {
        return;
    }

    // Fetch group metadata
    const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
    const { participants } = groupMetadata;

    // Build the tag message
    let teks = "Tagging all group members:\n";
    for (let mem of participants) {
        teks += ` @${mem.id.split("@")[0]}\n`;
    }

    // Send the tag message
    await sock.sendMessage(message.key.remoteJid, {
        text: teks.trim(),
        mentions: participants.map((a) => a.id),
    });
};


const leaveGroup = async (sock, message) => {
    try {
	    const botId = decodeJid(sock.user.id);
	    const participantId = decodeJid(message.key.participant);
        

        // Restrict the command to the bot itself
        if (participantId !== botId) {
            await sock.sendMessage(message.key.remoteJid, {
                text: "⚠️ Only the bot can use this command.",
		    
            });
            return;
        }

        // Check if the message is in a group
        if (!isInGroup(message)) {
            return;
        }
await delay(1000)

        // Leave the group
        await sock.groupLeave(message.key.remoteJid);

        await sock.sendMessage(sock.user.id, {
            text: "_Left successfully_"},{quoted:message});
    } catch (error) {
        console.error("Error in leaveGroup command:", error);
        await sock.sendMessage(message.key.remoteJid, {
            text: "❌ An error occurred while trying to leave the group.",
        });
    }
};

const tag = async (sock, message, match) => {
  try {
    // Ensure the command is used in a group
    if (!message.key.remoteJid.endsWith("@g.us")) {
      return;
    }

    // Fetch group metadata
    const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
    const { participants } = groupMetadata;

    // Handle quoted message case first
    if (isQuotedMessage(message)) {
      const quotedInfo = getQuotedInfo(message);

      // Extract text from the quoted message
      if (quotedInfo.type === "text" && quotedInfo.quotedMessage) {
        match = quotedInfo.quotedMessage.conversation ||quotedInfo.quotedMessage.extendedTextMessage.text ;
      }
    }

    // Ensure match is properly extracted from input or quote
    match = match || "";

    // If match is an array, join it into a string
    if (Array.isArray(match)) {
      match = match.join(" ");
    }

    // Ensure match is a valid string
    if (!match || typeof match !== "string" || match.trim() === "") {
      await sock.sendMessage(message.key.remoteJid, {
        text: "_Please provide a message or reply to one to tag the group._",
      });
      return;
    }

    // Send the message with mentions
    await sock.sendMessage(message.key.remoteJid, {
      text: match,
      mentions: participants.map((participant) => participant.id),
    });
  } catch (error) {
    console.error("Error in tag command:", error);
    await sock.sendMessage(message.key.remoteJid, {
      text: "_An error occurred while executing the tag command._",
    });
  }
};



async function handleJoinCommand(sock, message, args) {
    let groupLink;

    // Extract link from quoted message or command argument
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation) {
        groupLink = m.quoted.conversation || m.quoted.extendedTextMessage;
    } else if (args.length > 0) {
        groupLink = args[0];
    } else {
        await sock.sendMessage(message.key.remoteJid, {
            text: 'Please provide or quote a valid group link to join.',
        });
        return;
    }

    // Validate the group link format 
    const groupInviteRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,})/;
const match = groupLink.match(groupInviteRegex);

if (!match) {
    await sock.sendMessage(message.key.remoteJid, {
        text: 'Invalid group link! Please provide a valid WhatsApp group link.',
    });
    return;
}

const inviteCode = match[1];

try {
    // Attempt to join the group
    const groupMetadata = await sock.groupAcceptInvite(inviteCode);
    await sock.sendMessage(message.key.remoteJid, {
        text: `*Successfully joined the group*`,
    });
} catch (error) {
    console.error('Error joining group:', error);
    let errorMessage = '_ERROR JOINING GROUP _';

    if (error.message.includes('request to join')) {
        // Handle request-based group
        await sock.sendMessage(message.key.remoteJid, {
            text: 'The group requires admin approval to join. Request sent successfully!',
        });
    } else if (error.message.includes('invalid')) {
        errorMessage = 'The group link is invalid or expired.';
    } else if (error.message.includes('not-authorized')) {
        errorMessage = 'The bot is not authorized to join this group.';
    }

    await sock.sendMessage(message.key.remoteJid, { text: errorMessage });
}

}

sophia({
   name: 'join',
   description: 'Joins a WhatsApp group using an invite link',
   execute: handleJoinCommand,
    accessLevel: 'public', // Restrict to owners for security
   category: 'Utility',
    isGroupOnly:false
});

sophia({
  name:"demote",
  description:"To remove a user from admin",
  execute: async function (sock, message) {
  try {
    // Check if the message is from a group
    if (!message.key.remoteJid.endsWith("@g.us")) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_This command is for groups only_",
      });
    }

    // Check if the user executing the command is an admin
    const isadmin = await isAdmin(
      message.key.remoteJid,
      message.key?.participant,
      sock
    );
    if (!isadmin) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_You need to be an admin to use this command._",
      });
    }

    // Extract mentioned JIDs and quoted JID
    let mentionedJid =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
    if (quotedParticipant) {
      mentionedJid.push(quotedParticipant);
    }

    // Ensure the JIDs are formatted correctly
    const ensureJidFormat = (jid) =>
      jid.endsWith("@s.whatsapp.net") ? jid : jid + "@s.whatsapp.net";
    mentionedJid = mentionedJid.map(ensureJidFormat);

    // Handle case when there's no valid JID
    if (mentionedJid.length === 0) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_Mention a user or quote a message to demote._",
      });
    }

    // Check if the bot itself is being promoted
    const botJid = decodeJid(sock.user.id);
    if (mentionedJid.includes(botJid)) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_I cannot demote myself._",
      });
    }

    // Check if the target user is the group owner
    const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
    const ownerJid = groupMetadata.owner || null;
    if (mentionedJid.includes(ownerJid)) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_I cannot demote the group owner._",
      });
    }
  // Promote the participant(s)
    await sock.groupParticipantsUpdate(
      message.key.remoteJid,
      mentionedJid,
      "demote"
    );

    // Send message with mentions
    return await sock.sendMessage(message.key.remoteJid, {
      text: `_demoted:_\n${mentionedJid
        .map((jid) => `@${jid.split("@")[0]}`)
        .join("\n")}`,
      mentions: mentionedJid,
    });
  } catch (error) {
    console.error("Error in promote command:", error);
    return await sock.sendMessage(message.key.remoteJid, {
      text: "_An error occurred while trying to promote the member._",
    });
  }
},
  accessLevel:'private',
  category: 'Group',
  isGroupOnly:true
})

sophia({
    name:'tagall',
    description:'Tag all members in the group',
  execute: tagAll,
    accessLevel:'public',
   category: 'Group',
  isGroupOnly: true
});

sophia({
	name:'tag',
description:	'tag members of a group',
	execute:tag,
accessLevel:	'public',
	category:'Group',
	isGroupOnly:true
});;

sophia({
  name:"kick",
  description:"To kick a member(s) of a group",
  execute: async function handleKickCommand(sock, message) {
  try {
    // Check if the message is from a group
    if (!message.key.remoteJid.endsWith("@g.us")) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_This command is for groups only_",
      });
    }

    // Check if the user executing the command is an admin
    const isadmin = await isAdmin(
      message.key.remoteJid,
      message.key?.participant,
      sock
    );
    if (!isadmin) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_You need to be an admin to use this command._",
      });
    }

    // Extract mentioned JIDs and quoted JID
    let mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedInfo = message.message?.extendedTextMessage?.contextInfo;
    if (quotedInfo?.participant) {
      mentionedJid.push(quotedInfo.participant);
    }

    // Ensure the JIDs are formatted correctly
    const ensureJidFormat = (jid) =>
      jid.endsWith("@s.whatsapp.net") ? jid : jid + "@s.whatsapp.net";
    mentionedJid = mentionedJid.map(ensureJidFormat);

    // Handle case when there's no valid JID
    if (mentionedJid.length === 0) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_Mention a user or quote a message to kick._",
      });
    }

    // Check if the bot itself is being kicked
    const botJid = decodeJid(sock.user.id);
    if (mentionedJid.includes(botJid)) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_I cannot kick myself._",
      });
    }

    // Check if the target user is the group owner
    const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
    const ownerJid = groupMetadata.owner || null;
    if (mentionedJid.includes(ownerJid)) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_I cannot kick the group owner._",
      });
    }

    // Notify before kicking
    await sock.sendMessage(message.key.remoteJid, {
      text: "_Kicking..._",
    });

    // Add delay between kicking participants (3 seconds per participant)
    for (let i = 0; i < mentionedJid.length; i++) {
      try {
        await sock.groupParticipantsUpdate(
          message.key.remoteJid,
          [mentionedJid[i]],
          "remove"
        );
        console.log(`Kicked JID: ${mentionedJid[i]}`);
        
        // Send message with mentions
        if (i === mentionedJid.length - 1) {
          await sock.sendMessage(message.key.remoteJid, {
            text: `_Kicked:_\n${mentionedJid
              .map((jid) => `@${jid.split("@")[0]}`)
              .join("\n")}`,
            mentions: mentionedJid,
          });
        }

        // Add a 3-second delay between each kick
        if (i < mentionedJid.length - 1) {
          await delay(3000); // 3-second delay between kicks
        }
      } catch (error) {
        console.error("Error in groupParticipantsUpdate:", error);
        await sock.sendMessage(message.key.remoteJid, {
          text: "_Failed to kick the user. Make sure I have admin permissions._",
        });
      }
    }

  } catch (error) {
    console.error("Error in kick command:", error);
    return await sock.sendMessage(message.key.remoteJid, {
      text: `_An error occurred while trying to kick the member._ ${error.message}`,
    });
  }
},
  accessLevel:'private',
  category: 'Group',
  isGroupOnly:true
})

sophia({
  name:"promote",
  description:"To make a user admin",
  execute: async function (sock, message) {
  try {
    // Check if the message is from a group
    if (!message.key.remoteJid.endsWith("@g.us")) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_This command is for groups only_",
      });
    }

    // Check if the user executing the command is an admin
    const isadmin = await isAdmin(
      message.key.remoteJid,
      message.key?.participant,
      sock
    );
    if (!isadmin) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_You need to be an admin to use this command._",
      });
    }

    // Extract mentioned JIDs and quoted JID
    let mentionedJid =
      message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
    if (quotedParticipant) {
      mentionedJid.push(quotedParticipant);
    }

    // Ensure the JIDs are formatted correctly
    const ensureJidFormat = (jid) =>
      jid.endsWith("@s.whatsapp.net") ? jid : jid + "@s.whatsapp.net";
    mentionedJid = mentionedJid.map(ensureJidFormat);

    // Handle case when there's no valid JID
    if (mentionedJid.length === 0) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_Mention a user or quote a message to promote._",
      });
    }

    // Check if the bot itself is being promoted
    const botJid = decodeJid(sock.user.id);
    if (mentionedJid.includes(botJid)) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_I cannot promote myself._",
      });
    }

    // Check if the target user is the group owner
    const groupMetadata = await sock.groupMetadata(message.key.remoteJid);
    const ownerJid = groupMetadata.owner || null;
    if (mentionedJid.includes(ownerJid)) {
      return await sock.sendMessage(message.key.remoteJid, {
        text: "_I cannot promote the group owner._",
      });
    }
  // Promote the participant(s)
    await sock.groupParticipantsUpdate(
      message.key.remoteJid,
      mentionedJid,
      "promote"
    );

    // Send message with mentions
    return await sock.sendMessage(message.key.remoteJid, {
      text: `_Promoted:_\n${mentionedJid
        .map((jid) => `@${jid.split("@")[0]}`)
        .join("\n")}`,
      mentions: mentionedJid,
    });
  } catch (error) {
    console.error("Error in promote command:", error);
    return await sock.sendMessage(message.key.remoteJid, {
      text: "_An error occurred while trying to promote the member._",
    });
  }
},
  accessLevel:'private',
  category: 'Group',
  isGroupOnly:true
})


sophia({
	name:'left',
description:	'to leave a group',
execute:	leaveGroup,
accessLevel:	'private',
category:	'Group',
	isGroupOnly: true
});

sophia({
  name: 'revoke',
  description: 'Revoke and regenerate the group invite link.',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid
    if(!await isAdmin(remoteJid,message.key.participant,sock)) return console.wa("_You need to be an admin to use this command._",message)
    const newCode = await sock.groupRevokeInvite(remoteJid);
    sock.sendMessage(remoteJid, { text: `New group invite link: https://chat.whatsapp.com/${newCode}` });
  },
  accessLevel: 'public',
  category: 'Group',
  isGroupOnly: true
});

sophia({
  name: 'invite',
  description: 'Get the current group invite link.',
  execute: async (sock, message, args) => {
    const remoteJid = message.key.remoteJid;
    if(!await isAdmin(remoteJid,message.key.participant,sock)) return console.wa("_You need to be an admin to use this command._",message)
    const code = await sock.groupInviteCode(remoteJid);
    sock.sendMessage(remoteJid, { text: `Group invite link: https://chat.whatsapp.com/${code}` });
  },
  accessLevel: 'public',
  category: 'Group',
  isGroupOnly: true
});

sophia({
    name: 'antilink',
    description: 'Enable or disable link detection in a group.',
    execute: async (sock, message, args) => {
        if (!message.key.remoteJid.endsWith('@g.us')) {
          await console.wa( 'This command can only be used in groups.',message);
        return;
          
        }
    const isadmin = await isAdmin(
      message.key.remoteJid,
      message.key?.participant,
      sock
    );
    if(!isadmin){
      await console.wa('_You are not an admin_',message)
   return;
    }
        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            enableLinkDetection(message.key.remoteJid);
            await console.wa( 'Link detection has been enabled in this group.',message);
        } else if (action === 'off') {
            disableLinkDetection(message.key.remoteJid);
            await console.wa('Link detection has been disabled in this group.',message);
        } else {
            await console.wa( 'Usage: .test <on|off>',message);
        }
    },
    accessLevel: 'private',
    category: 'Group',
    isGroupOnly: true,
});