async function react(reactionType, message) {
  const reactions = {
    p: '⏳',  // pending
    e: '❌',  // error
    c: '✅',  // completed
  };

  // Default to '❌' if the reactionType is invalid
  const emoji = reactions[reactionType] || '❌';

  if (emoji) {
    await console.waReact(emoji, message.key);

    // If it's not 'p', remove the emoji after 5 seconds
    if (reactionType !== 'p') {
      setTimeout(() => {
        console.waReact(null, message.key);
      }, 5000); // Remove after 5 seconds
    }
  }
}
module.exports = react;