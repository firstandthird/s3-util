class Storage {
  constructor(config) {
    this.config = config;
    if (config.bucket) {
      const AWS = require('aws-sdk');
      config.aws = new AWS.S3();
      this.library = require('./lib/remote');
    } else {
      config.separator = config.separator || '##'; // try to use a separator that isn't commonplace like '_'
      this.library = require('./lib/local');
    }
  }

  put(key, body, acl = false) {
    return this.library.put(key, body, acl, this.config);
  }

  get(key, version = false, fallback = false) {
    return this.library.get(key, version, this.config, fallback);
  }

  getBulk(arrayOfKeys, version = false, fallback = false) {
    return Promise.all(arrayOfKeys.map(key =>
      this.library.get(key, version, this.config, fallback)));
  }

  exists(key) {
    return this.library.exists(key, this.config);
  }

  list(prefix = false, continuationToken = false, pageSize = false) {
    return this.library.list(prefix, continuationToken, pageSize, this.config);
  }

  async listAndGet(prefix = false, continuationToken = false, pageSize = false) {
    const list = await this.library.list(prefix, continuationToken, pageSize, this.config);
    if (list.Contents) {
      return this.getBulk(list.Contents.map(l => l.Key));
    }
    return this.getBulk(list.CommonPrefixes.map(l => `${prefix}${l.Prefix}`));
  }

  listVersions(prefix, publishedPrefix = false) {
    return this.library.listVersions(prefix, publishedPrefix, this.config);
  }

  delete(prefix, publishedPrefix = false, config) {
    return this.library.delete(prefix, publishedPrefix, this.config);
  }
}

module.exports = Storage;
