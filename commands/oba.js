const { exec } = require('child_process');
const fetch = 'git fetch';
const log = 'git log main..origin/main --oneline';
const pull = 'git pull';
const npmRestart = 'npm restart';  // Command to restart the app
const Command = require('command');

async function handleUpdateCommand(sock, message, args) {
  try {
    // First, silently fetch the latest updates
    exec(fetch, async (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        await console.wa('An error occurred while fetching updates.', message);
        return;
      }

      // Now check for any commits that aren't in your local repo
      exec(log, async (logError, logOutput, logStderr) => {
        if (logError) {
          console.error(`exec error: ${logError}`);
          await console.wa('An error occurred while checking for updates.', message);
          return;
        }

        if (logOutput.trim()) {
          // There are commits in the remote repo that aren't in the local branch
          await console.wa(`New updates available:\n${logOutput}`, message);
        

          if (args[0] === 'now') {
            // User wants to pull the updates and restart the bot
            await console.wa('Updating... Please wait.', message);

            // Perform git pull to update the bot
            exec(pull, async (pullError, pullOutput, pullStderr) => {
              if (pullError) {
                console.error(`exec error: ${pullError}`);
                await console.wa('An error occurred while updating the bot.', message);
                return;
              }

              // After pulling, inform the user and restart the bot
              await console.wa('Updated successfully. Restarting bot...', message);

              // Restart the bot using 'npm restart'
              exec(npmRestart, (restartError, restartOutput, restartStderr) => {
                if (restartError) {
                  console.error(`exec error: ${restartError}`);
                  console.wa(`An error occurred while restarting the bot.${restartError}`, message);
                  return;
                }

                console.log('Bot restarted successfully!');
              });
            });
          }
        } else {
          // No new commits, bot is up to date
          await console.wa('Bot is up to date.', message);
        }
      });
    });
  } catch (err) {
    console.error(`Error in handleUpdateCommand: ${err}`);
    await console.wa('An unexpected error occurred.', message);
  }
}

const updateCommand = new Command(
  'update',
  'updating the bot',
  handleUpdateCommand,
  'private',
  'Utility',
  false
);

module.exports = { updateCommand };