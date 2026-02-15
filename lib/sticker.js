const fs = require('fs');
const path = require('path');
const Crypto = require('crypto');
const ff = require('fluent-ffmpeg');
const webp = require('node-webpmux');
const { STICKER_PACKNAME } = require('../config');
const formData = require("form-data");
const { JSDOM } = require("jsdom");
let fetch;

async function loadFetch() {
  fetch = await import('node-fetch').then(mod => mod.default);
}
const tempDir = path.join(__dirname, '../temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

async function convertToWebp(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ff(inputPath)
      .output(outputPath)
      .format('webp')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

async function writeExifImg(media, metadata) {
  const tmpFileIn = path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  const tmpFileOut = path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

  await convertToWebp(media, tmpFileIn);

  if (metadata.packname || metadata.author) {
    try {
      const img = new webp.Image();
      const json = {
        "sticker-pack-id": `https://github.com/A-Y-A-N-O-K-O-J-I`,
        "sticker-pack-name": metadata.packname,
        ...(metadata.author && { "sticker-pack-publisher": metadata.author }),
        emojis: metadata.categories ? metadata.categories : [""],
      };
      const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
      ]);
      const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
      const exif = Buffer.concat([exifAttr, jsonBuff]);
      exif.writeUIntLE(jsonBuff.length, 14, 4);
      await img.load(tmpFileIn); // Load the webp image
      fs.unlinkSync(tmpFileIn); // Remove the temporary webp file after loading
      img.exif = exif;
      await img.save(tmpFileOut);
      const buffer = fs.readFileSync(tmpFileOut);
      fs.unlinkSync(tmpFileOut);
      return buffer;
    } catch (error) {
      console.error("Error processing EXIF data:", error);
      throw error;
    }
  }
}

async function videoToWebp(media) {
  const tmpFileOut = path.join(
    tempDir,
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  const tmpFileIn = path.join(
    tempDir,
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`
  );

  fs.writeFileSync(tmpFileIn, media);

  await new Promise((resolve, reject) => {
    ff(tmpFileIn)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec",
        "libwebp",
        "-vf",
        "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        "-loop",
        "0",
        "-ss",
        "00:00:00",
        "-t",
        "00:00:08",
        "-preset",
        "default",
        "-an",
        "-vsync",
        "0",
      ])
      .toFormat("webp")
      .save(tmpFileOut);
  });

  const buff = fs.readFileSync(tmpFileOut);
  fs.unlinkSync(tmpFileOut);
  fs.unlinkSync(tmpFileIn);
  return buff;
}
async function writeExifVid(media, metadata) {
  let wMedia = await videoToWebp(media);
  const tmpFileIn = path.join(
    tempDir,
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  const tmpFileOut = path.join(
    tempDir,
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  fs.writeFileSync(tmpFileIn, wMedia);

  if (metadata.packname || metadata.author) {
    const img = new webp.Image();
    const json = {
      "sticker-pack-id": `https://github.com/sataniceypz`,
      "sticker-pack-name": metadata.packname,
      "sticker-pack-publisher": metadata.author,
      emojis: metadata.categories ? metadata.categories : [""],
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);
    img.exif = exif;
    await img.save(tmpFileOut);
	const buff = fs.readFileSync(tmpFileOut);
    return buff;
  }
}

async function convertWebpToMp4(source) {
  await loadFetch();
  let form = new formData();
  let isUrl = typeof source === "string" && /https?:\/\//.test(source);

  form.append("new-image-url", isUrl ? source : "");
  form.append("new-image", isUrl ? "" : source, "image.webp");

  // Step 1: Send the initial request to ezgif
  let res = await fetch("https://ezgif.com/webp-to-mp4", {
    method: "POST",
    body: form,
  });
  let html = await res.text();
  let { document } = new JSDOM(html).window;
  // Step 2: Prepare the second form request
  let form2 = new formData();
  let obj = {};
  for (let input of document.querySelectorAll("form input[name]")) {
    obj[input.name] = input.value;
    form2.append(input.name, input.value);
  }

  // Step 3: Submit the second request to get the MP4
  let res2 = await fetch("https://ezgif.com/webp-to-mp4/" + obj.file, {
    method: "POST",
    body: form2,
  });
  let html2 = await res2.text();
  let { document: document2 } = new JSDOM(html2).window;

  // Extract and return the MP4 URL
  return new URL(
    document2.querySelector("div#output > p.outfile > video > source").src,
    res2.url
  ).toString();
}

async function convertToAny(inputPath, format) {
  // Generate random output filename based on the format
  const randomName = Crypto.randomBytes(6).toString('hex');
  const outputPath = path.join(__dirname, 'temp', `${randomName}.${format}`);

  return new Promise((resolve, reject) => {
    fluentFFmpeg(inputPath)
      .output(outputPath)
      .format(format)  // Automatically uses the provided format
      .on('end', () => {
        // Read the converted file as a buffer and return it
        const buffer = fs.readFileSync(outputPath);
        fs.unlinkSync(outputPath); // Cleanup the file after reading
        resolve(buffer);
      })
      .on('error', reject)
      .run();
  });
}

async function writeExifWebp(media, metadata) {
  const tmpFileIn = path.join(
    tempDir,
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  const tmpFileOut = path.join(
    tempDir,
    `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`
  );
  fs.writeFileSync(tmpFileIn, media);

  // Default packname and author
  const defaultPackname = "SOPHIA-MD❤️";
  const defaultAuthor = "STICKER CREATED BY AYANOKOJI";

  let packname = defaultPackname;
  let author = defaultAuthor;

  // Split metadata string into packname and author if it's a string
  if (typeof metadata === "string") {
    const parts = metadata.split(",").map((item) => item.trim());
    if (parts.length === 1 && parts[0]) {
      // If only one value is provided, set it as packname
      packname = parts[0];
      author = undefined;
    } else if (parts.length >= 2) {
      // If both packname and author are provided
      packname = parts[0] || defaultPackname;
      author = parts[1] || defaultAuthor;
    }
  }

  if (packname || author) {
    const img = new webp.Image();
    const json = {
      "sticker-pack-id": `https://github.com/sataniceypz/Eypz-xd`,
      "sticker-pack-name": packname,
      "sticker-pack-publisher": author,
      emojis: metadata.categories ? metadata.categories : [""],
    };
    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    await img.load(tmpFileIn);
    fs.unlinkSync(tmpFileIn);

    img.exif = exif;
    await img.save(tmpFileOut);

    const buffer = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut);
    return buffer;
  }
}
async function createImgSticker(mediaPath, metadata) {
  try {
    // Set defaults
    const defaultPackname = "SOPHIA-MD❤️❤️";
    const defaultAuthor = "STICKER CREATED BY AYANOKOJI";

    let packname = defaultPackname;
    let author = defaultAuthor;

    // Handle metadata
    if (typeof metadata === "string") {
      const parts = metadata.split(",").map(item => item.trim());
      if (parts.length === 1 && parts[0]) {
        // Only one value provided; treat it as packname
        packname = parts[0];
        author = undefined; // Set author to undefined
      } else if (parts.length >= 2) {
        // Both values provided
        packname = parts[0] || defaultPackname;
        author = parts[1] || defaultAuthor;
      }
    } else if (metadata && typeof metadata === "object") {
      packname = metadata.packname || defaultPackname;
      author = metadata.author || defaultAuthor;
    }

    // Create the sticker
    const buffer = await writeExifImg(mediaPath, { packname, author });
    console.log("Image Sticker created successfully!");
    return buffer;
  } catch (error) {
    console.error("Error creating image sticker:", error);
    throw error;
  }
}

async function createVidSticker(mediaPath, metadata) {
  try {
    // Set defaults
    const defaultPackname = "SOPHIA-MD❤️";
    const defaultAuthor = "STICKER CREATED BY AYANOKOJI";

    let packname = defaultPackname;
    let author = defaultAuthor;

    // Handle metadata
    if (typeof metadata === "string") {
      const parts = metadata.split(",").map(item => item.trim());
      if (parts.length === 1 && parts[0]) {
        // Only one value provided; treat it as packname
        packname = parts[0];
        author = undefined; // Set author to undefined
      } else if (parts.length >= 2) {
        // Both values provided
        packname = parts[0] || defaultPackname;
        author = parts[1] || defaultAuthor;
      }
    } else if (metadata && typeof metadata === "object") {
      packname = metadata.packname || defaultPackname;
      author = metadata.author || defaultAuthor;
    }

    // Create the sticker
    const buffer = await writeExifVid(mediaPath, { packname, author });
    console.log("Video Sticker created successfully!");
    return buffer;
  } catch (error) {
    console.error("Error creating video sticker:", error);
    throw error;
  }
}

module.exports = { createImgSticker,createVidSticker,convertToWebp,writeExifImg,convertToAny,writeExifWebp,convertWebpToMp4 }