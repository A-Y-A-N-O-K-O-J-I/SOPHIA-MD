const Command= require('../lib/Command');

const boomCommand = new Command(
  'boom',                                         // Command name
  'Test out Sophia MD boom?',                     // Description
  boomCommandFunction,                            // Function to execute
  'private',                                      // Access level (you can set to 'public' if needed)
  'Interactive',                                  // Category (set as needed, e.g., 'Interactive' for carousel-related features)
  false                                           // Group command (false for individual chats, true for groups)
);

// The boomCommandFunction should be defined as the function to send the carousel message:
async function boomCommandFunction(sock, message) {
  const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

  const sendBoomMessage = async (jid) => {
    const slides = [
      {
        image: 'https://i.waifu.pics/POqiwlb.jpg',
        title: 'Slide 1 Title',
        body: 'This is the first slide body.',
        footer: 'Slide 1 Footer',
        buttons: [
          {
            buttonType: 'cta_url',
            buttonText: 'Another boom',
            buttonCommand: 'https://example.com',
            url: 'https://example.com',
          },
          {
            buttonType: 'quick_reply',
            buttonText: 'BOOM 💥💣',  // The button text you requested
            buttonCommand: 'boom_command',
          },
        ],
      },
      {
        image: 'https://i.waifu.pics/Fs1hUxz.jpg',
        title: 'Slide 2 Title',
        body: 'This is the second slide body.',
        footer: 'Slide 2 Footer',
        buttons: [
          {
            buttonType: 'cta_url',
            buttonText: 'BOOM2💣💥',
            buttonCommand: 'https://google.com',
            url: 'https://google.com',
          },
        ],
      },
    ];

    const cards = slides.map(async (slide) => {
      const {
        image,
        title: slideTitle,
        body: slideBody,
        footer: slideFooter,
        buttons, // Now expecting an array of buttons
      } = slide;

      const buttonsData = await Promise.all(buttons.map(async (button) => {
        const { buttonType, buttonText, buttonCommand, url } = button;
        const buttonParamsJson = getButtonParams(buttonType, buttonText, buttonCommand, url);
        return JSON.stringify(buttonParamsJson);
      }));

      return {
        body: proto.Message.InteractiveMessage.Body.fromObject({ text: slideBody }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: slideFooter }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          title: slideTitle,
          hasMediaAttachment: true,
          ...(await prepareWAMessageMedia({
            image: { url: image },
          }, { upload: sock.waUploadToServer })),
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: buttonsData.map((btn) => ({
            name: 'quick_reply', // Or you can dynamically set button type here
            buttonParamsJson: btn,
          })),
        }),
      };
    });

    const msg = generateWAMessageFromContent(
      jid,
      {
        viewOnceMessage: {
          message: {
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.fromObject({ text: "wanna test out Sophia MD boom?" }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: "Carousel Footer" }),
              header: proto.Message.InteractiveMessage.Header.fromObject({
                title: 'Boom Carousel FOr SOPHIA-MD',
                subtitle: 'BOOOOOOOOOOOOOOOOOOOM!',
                hasMediaAttachment: false,
              }),
              carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                cards: await Promise.all(cards),
              }),
            }),
          },
        },
      },
      {}
    );

    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
  };

  sendBoomMessage(message.key.remoteJid);
}

// Helper function to get button parameters
const getButtonParams = (buttonType, buttonText, buttonCommand, url) => {
  switch (buttonType) {
    case 'cta_url':
      return { display_text: buttonText, url, merchant_url: url };
    case 'cta_call':
      return { display_text: buttonText, id: buttonCommand };
    case 'cta_copy':
      return { display_text: buttonText, copy_code: buttonCommand };
    case 'cta_reminder':
    case 'cta_cancel_reminder':
    case 'address_message':
      return { display_text: buttonText, id: buttonCommand };
    case 'send_location':
      return {};
    case 'quick_reply':
      return { display_text: buttonText, id: buttonCommand };
    default:
      return {};
  }
}

module.exports = { boomCommand }
