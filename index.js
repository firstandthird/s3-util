class Storage {
  constructor(config = {}) {
    this.config = config;
    if (config.bucket) {
      const AWS = require('aws-sdk');
      config.aws = new AWS.S3();
      this.library = require('./lib/remote');
    } else if (config.root) {
      config.separator = config.separator || '##';
      this.library = require('./lib/local');
    }
  }

  put(key, body, acl = false) {
    return this.library.put(key, body, acl, this.config);
  }

  get(key, version = false) {
    return this.library.get(key, version, this.config);
  }

  async exists(key) {
    return this.library.exists(key, this.config);
  }

  list(prefix = false, continuationToken = false, pageSize = false) {
    return this.library.list(prefix, continuationToken, pageSize, this.config);
  }

  async listVersions(prefix, publishedPrefix = false) {
    return this.library.listVersions(prefix, publishedPrefix, this.config);
  }

  async delete(prefix, publishedPrefix = false, config) {
    return this.library.delete(prefix, publishedPrefix, this.config);
  }
}

module.exports = Storage;
