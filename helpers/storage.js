const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand
} = require('@aws-sdk/client-s3');

const bucket = process.env.R2_BUCKET;

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED'
});

// images that are not tied to an album folder (logo, main image, promo images, ...)
exports.generalKey = (name) => `general/${name}`;
exports.albumKey = (albumId, name) => `albums/${albumId}/${name}`;

exports.putObject = (key, body, contentType) => client.send(new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  Body: body,
  ContentType: contentType
}));

// returns the raw response; Body is a readable stream. pass ifNoneMatch to get a 304 when the file did not change
exports.getObject = (key, ifNoneMatch) => client.send(new GetObjectCommand({
  Bucket: bucket,
  Key: key,
  IfNoneMatch: ifNoneMatch
}));

exports.deleteObject = (key) => client.send(new DeleteObjectCommand({
  Bucket: bucket,
  Key: key
}));

// R2 accepts up to 1000 keys per request
exports.deleteObjects = async (keys) => {
  for (let i = 0; i < keys.length; i += 1000) {
    await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.slice(i, i + 1000).map(Key => ({ Key })),
        Quiet: true
      }
    }));
  }
}

exports.isNotFound = (error) => error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404;
exports.isNotModified = (error) => error?.$metadata?.httpStatusCode === 304;
