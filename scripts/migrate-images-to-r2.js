// One-off script: uploads everything in ./images to R2 and fills in Image.key.
//   node scripts/migrate-images-to-r2.js --dry-run   (only prints what it would do)
//   node scripts/migrate-images-to-r2.js
//
// ./images/<file>            -> general/<file>
// ./images/<albumId>/<file>  -> albums/<albumId>/<file>
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const mongo = require('../db/mongo');
const Image = require('../db/models/image');
const { generalKey, albumKey, putObject } = require('../helpers/storage');

const imagesDir = path.join(__dirname, '..', 'images');
const dryRun = process.argv.includes('--dry-run');

const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const upload = async (filePath, key) => {
  const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  console.log(`${dryRun ? '[dry-run] ' : ''}${filePath} -> ${key}`);

  if (!dryRun) {
    await putObject(key, fs.readFileSync(filePath), contentType);
  }
}

const run = async () => {
  await mongo();

  const uploaded = new Set();

  for (const entry of fs.readdirSync(imagesDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const file of fs.readdirSync(path.join(imagesDir, entry.name))) {
        await upload(path.join(imagesDir, entry.name, file), albumKey(entry.name, file));
        uploaded.add(albumKey(entry.name, file));
      }
    } else {
      await upload(path.join(imagesDir, entry.name), generalKey(entry.name));
      uploaded.add(generalKey(entry.name));
    }
  }

  // records created before the key field existed
  const docs = await Image.find({ key: { $exists: false } });
  for (const doc of docs) {
    const inAlbum = doc.album_id && uploaded.has(albumKey(doc.album_id, doc.name));
    const key = inAlbum ? albumKey(doc.album_id, doc.name) : generalKey(doc.name);

    console.log(`${dryRun ? '[dry-run] ' : ''}record ${doc.name} -> key ${key}`);
    if (!dryRun) {
      await Image.updateOne({ _id: doc._id }, { key });
    }
  }

  console.log('DONE');
  process.exit(0);
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
