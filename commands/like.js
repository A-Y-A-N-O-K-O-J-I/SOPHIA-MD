const sophia = require("sophia");
const like = require("../lib/like");

sophia({
  name: 'autolike',
  description: 'Toggle auto like status',
  execute: async function(sock, message, args) {
    const status = like.getAutoLikeStatus();
    
    // If no arguments provided, just show current status
    if (args.length === 0) {
      if (status.enabled) {
        await console.wa("_Auto like status is currently on_\n_Use 'autolike off' to turn it off_", message);
        return;
      } else {
        await console.wa("_Auto like status is currently off_\n_Use 'autolike on' to turn it on_", message);
        return;
      }
    }
    
    try {
      // Handle on/off toggling
      if (args[0].toLowerCase() === "on") {
        // If already on, just inform
        if (status.enabled) {
          await console.wa("_Auto like is already enabled_", message);
          return;
        }
        
        // Turn it on
        const result = await like.autoLikeMode("on");
        if (result.success) {
          await console.wa("_✅ Auto like has been enabled_", message);
        } else {
          await console.wa(`_❌ Failed to enable auto like: ${result.message}_`, message);
        }
        return;
      } 
      
      else if (args[0].toLowerCase() === "off") {
        // If already off, just inform
        if (!status.enabled) {
          await console.wa("_Auto like is already disabled_", message);
          return;
        }
        
        // Turn it off
        const result = await like.autoLikeMode("off");
        if (result.success) {
          await console.wa("_✅ Auto like has been disabled_", message);
        } else {
          await console.wa(`_❌ Failed to disable auto like: ${result.message}_`, message);
        }
        return;
      }
      
      // Change the emoji if a second argument is provided
      else if (args[0].toLowerCase() === "emoji" && args.length > 1) {
        const newEmoji = args[1];
        // Validate if it's a single emoji
        if (newEmoji.length > 2) {
          await console.wa("_❌ Please provide a single emoji_", message);
          return;
        }
        
        const result = await like.autoLikeMode(status.enabled ? "on" : "off", newEmoji);
        if (result.success) {
          await console.wa(`_✅ Auto like emoji changed to ${newEmoji}_`, message);
        } else {
          await console.wa(`_❌ Failed to change emoji: ${result.message}_`, message);
        }
        return;
      }
      
      // If argument is not recognized
      else {
        await console.wa("_❌ Invalid option. Use 'on', 'off', or 'emoji [emoji]'_", message);
        return;
      }
    } catch (error) {
      console.error("Error in autolike command:", error);
      await console.wa(`_❌ An error occurred while processing your request_${error.message}` , message);
    }
  },
  accessLevel:"private",
  category:"Misc",
  isGroupOnly:false
});