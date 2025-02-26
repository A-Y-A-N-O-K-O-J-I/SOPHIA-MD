const Command = require('../lib/Command');
const { parsePhoneNumberFromString } = require('libphonenumber-js');

// Default country code for formatting (update as needed, e.g., 'NG' for Nigeria)
const DEFAULT_COUNTRY = 'NG';

// Function to modify and format phone numbers
const modifyPhoneNumber = (number) => {
  // Parse the phone number with the default country code
  const phoneNumber = parsePhoneNumberFromString(number, DEFAULT_COUNTRY);
  if (phoneNumber && phoneNumber.isValid()) {
    // Format the number in international format and prepare for WhatsApp
    const formattedNumber = phoneNumber.formatInternational().replace('+', '').replace(/\s+/g, '');
    return `${formattedNumber}@s.whatsapp.net`;
  } else {
    return null; // Return null if the number is invalid
  }
};

// Command handler for checking if a single number is on WhatsApp
const checkSingleNumber = async (sock, message) => {
  try {
    const input = (message.message.conversation || message.message.extendedTextMessage?.text)?.split(' ')[1];
    if (!input) {
      return sock.sendMessage(message.key.remoteJid, {
        text: '❌ Please provide a phone number to check. Example: #onwa 08012345678',
      });
    }

    const formattedNumber = modifyPhoneNumber(input);

    if (!formattedNumber) {
      return sock.sendMessage(message.key.remoteJid, {
        text: '❌ Invalid phone number format. Please check and try again.',
      });
    }

    // Check if the number is on WhatsApp
    try {
      const [result] = await sock.onWhatsApp(formattedNumber);
      const numberWithoutWhatsappNet = formattedNumber.replace('@s.whatsapp.net', '');

      if (result?.exists) {
        // Number exists on WhatsApp
        return sock.sendMessage(message.key.remoteJid, {
          text: `✅ Phone number *${numberWithoutWhatsappNet}* is on WhatsApp.`,
        });
      } else {
        // Number does not exist on WhatsApp
        return sock.sendMessage(message.key.remoteJid, {
          text: `❌ Phone number *${numberWithoutWhatsappNet}* is not on WhatsApp.`,
        });
      }
    } catch (error) {
      console.error('Error checking number status:', error);
      return sock.sendMessage(message.key.remoteJid, {
        text: '❌ There was an error checking the phone number. Please ty again later.',
      });
    }
  } catch (error) {
    console.error('Error in checkSingleNumber:', error);
    return sock.sendMessage(message.key.remoteJid, {
      text: '❌ An unexpected error occurred. Please try again.',
    });
  }
};

// Command registration
const command = new Command(
  'onwa', // Command name
  'Check if a phone number is on WhatsApp', // Command description
  checkSingleNumber, // Command function
  'public', // Access level
  'Utility', // Category
  false // Group-only restriction
);

module.exports = { command };
