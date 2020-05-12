const remote = {
  put(key, body, acl, config) {
    const params = {
      Bucket: config.bucket,
      Body: JSON.stringify(body),
      Key: key,
      ACL: acl || config.acl
    };
    if (!(body instanceof Array) && (body instanceof Object)) {
      params.ContentEncoding = 'application/json';
    }
    return config.aws.upload(params).promise();
  },
  async get(key, version = false, config) {
    const params = {
      Bucket: config.bucket,
      Key: key
    };
    if (version) {
      params.VersionId = version;
    }
    const res = await config.aws.getObject(params).promise();
    if (res.ContentEncoding === 'application/json') {
      return JSON.parse(res.Body.toString());
    }
    return res;
  },
  async exists(key, config) {
    try {
      const params = {
        Bucket: config.bucket,
        Key: key
      };
      await config.aws.getObject(params).promise();
      return true;
    } catch (e) {
      return false;
    }
  },
  list(prefix = false, continuationToken = false, pageSize = false, config) {
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
    return config.aws.listObjectsV2(params).promise();
  },
  // get published and unpublished versions and return them all:
  async listVersions(prefix, publishedPrefix, config) {
    const versions = await config.aws.listObjectVersions({
      Bucket: config.bucket,
      Prefix: prefix,
      Delimiter: config.delimiter
    }).promise();
    const publishedVersions = publishedPrefix ? await config.aws.listObjectVersions({
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
};

remote.delete = async (prefix, publishedPrefix = false, config) => {
  const allVersions = await remote.listVersions(prefix, publishedPrefix, config);
  const objects = allVersions.map(v => {
    const key = v.published ? publishedPrefix : prefix;
    return {
      VersionId: v.version,
      Key: key
    };
  });
  const all = await config.aws.deleteObjects({
    Bucket: config.bucket,
    Delete: {
      Objects: objects
    }
  }).promise();
  return all.Deleted.length;
};

module.exports = remote;
