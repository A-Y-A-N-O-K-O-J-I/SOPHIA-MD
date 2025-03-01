const styles = require('../lib/fancy');  // Assuming fancy.js is in lib folder
const sophia = require("sophia")
const fancyFonts = [
  "randomStyle", "strikeThrough", "wingdings", "vaporwave", "typewriter",
  "analucia", "tildeStrikeThrough", "underline", "doubleUnderline", "slashThrough",
  "sparrow", "heartsBetween", "arrowBelow", "crossAboveBelow", "creepify",
  "bubbles", "mirror", "squares", "roundsquares", "flip",
  "tiny", "serif_I", "manga", "ladybug", "runes",
  "serif_B", "serif_BI", "fancy1", "fancy2", "fancy3",
  "fancy4", "fancy5", "fancy6", "fancy7", "fancy8",
  "fancy9", "fancy10", "fancy11", "fancy12", "fancy13",
  "fancy14", "fancy15", "fancy16", "fancy17", "fancy18",
  "fancy19", "fancy20", "fancy21", "fancy22", "fancy23",
  "fancy24", "fancy25", "fancy26", "fancy27", "fancy28",
  "fancy29", "fancy30", "fancy31", "fancy32", "fancy33"
];
let downloadMedia;
if(!downloadMedia){
downloadMedia = require('../lib/downloadMedia');
}
sophia({
  name: "fancy",
  description: "Stylish text/fonts",
  execute: async function (sock, message, args) {
    const quoted = m.quoted;
    const fontIndex = args[0] ? parseInt(args[0]) - 1 : null;

    if (fontIndex === null) {
      // No number given - show full list
      let preview = fancyFonts.map((font, index) => {
        const styled = styles[font]("SOPHIA-MD");
        return `${index + 1}) ${styled}`;
      }).join("\n");
      await console.wa(preview,message)
      return;
    }

    if (isNaN(fontIndex) || fontIndex < 0 || fontIndex >= fancyFonts.length) {
      await console.wa("Invalid number. Use `.fancy` to see available styles.",message);
      return;
    }

    if (!quoted) {
      await console.wa("Reply to a text/image/video to apply the font." ,message);
      return;
    }

    const chosenFont = fancyFonts[fontIndex];
    const applyStyle = styles[chosenFont];

    if (!applyStyle) {
      await sock.sendMessage(message.chat, { text: "Font function missing in fancy.js." }, { quoted: message });
      return;
    }

    if (quoted.conversation || quoted.extendedTextMessage) {
      // Text reply - apply directly
      const styledText = applyStyle(quoted.conversation || quoted.extendedTextMessage.text);
      await console.wa(styledText,message);
    } else if (quoted.imageMessage || quoted.videoMessage) {
      // Image/Video - download media and resend with fancy caption
      const buffer = await downloadMedia(message);
      const caption = applyStyle(quoted.imageMessage?.caption || quoted.videoMessage?.caption || ""); // apply to caption
      const mediaType = quoted.imageMessage ? 'image' : 'video';

      await sock.sendMessage(message.key.remoteJid, {
        [mediaType]: buffer,
        caption
      }, { quoted: message });
    } else {
      await sock.sendMessage(message.key.remoteJid, { text: "Unsupported message type." }, { quoted: message });
    }
  },
  accessLevel: "public",
  category: "Fun",
  isGroupOnly:false
});