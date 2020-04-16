const AWS = require('aws-sdk');
const { config } = require('@firstandthird/arc-rapptor');

const remote = {
  // get published and unpublished versions and return them all:
  async listVersions(prefix, publishedPrefix = false) {
    const aws = new AWS.S3();
    const versions = await aws.listObjectVersions({
      Bucket: config.bucket,
      Prefix: prefix,
      Delimiter: config.delimiter
    }).promise();
    const publishedVersions = publishedPrefix ? await aws.listObjectVersions({
      Bucket: config.bucket,
      Prefix: publishedPrefix,
      Delimiter: config.delimiter
    }).promise() : { Versions: [] };
    return versions.Versions.map(v => ({
      published: false,
      version: v.VersionId,
      date: new Date(v.LastModified)
    })).concat(publishedVersions.Versions.map(v => ({
      published: true,
      version: v.VersionId,
      date: new Date(v.LastModified)
    })));
  },
  list(prefix = false, continuationToken = false, pageSize = false) {
    const aws = new AWS.S3();
    const params = {
      Bucket: config.bucket,
      Delimiter: config.delimiter
    };
    if (pageSize) {
      params.MaxKeys = pageSize;
    }
    if (continuationToken) {
      params.ContinuationToken = continuationToken;
    }
    if (prefix) {
      params.Prefix = prefix;
    }
    return aws.listObjectsV2(params).promise();
  },
  get(key, version = false) {
    const aws = new AWS.S3();
    const params = {
      Bucket: config.bucket,
      Key: key
    };
    if (version) {
      params.VersionId = version;
    }
    return aws.getObject(params).promise();
  },
  async exists(key) {
    try {
      const aws = new AWS.S3();
      const params = {
        Bucket: config.bucket,
        Key: key
      };
      await aws.getObject(params).promise();
      return true;
    } catch (e) {
      return false;
    }
  },
  put(key, body, acl) {
    const aws = new AWS.S3();
    return aws.upload({
      Bucket: config.bucket,
      Key: key,
      Body: JSON.stringify(body),
      ACL: acl || config.acl
    }).promise();
  }
};

remote.delete = async (prefix, publishedPrefix) => {
  const aws = new AWS.S3();
  const allVersions = await remote.listVersions(prefix, publishedPrefix);
  const objects = allVersions.map(v => {
    const key = v.published ? publishedPrefix : prefix;
    return {
      VersionId: v.version,
      Key: key
    };
  });
  const all = await aws.deleteObjects({
    Bucket: config.bucket,
    Delete: {
      Objects: objects
    }
  }).promise();
  return all.Deleted.length;
};

module.exports = remote;
