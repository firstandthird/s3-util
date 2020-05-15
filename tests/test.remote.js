const tap = require('tap');
const Storage = require('../index');

const s3 = new Storage({
  bucket: process.env.S3_BUCKET || 'ft-utils-test',
  delimiter: process.env.S3_DELIMITER || '/'
});

tap.test('put', async t => {
  const result = await s3.put('key1', 'some text');
  t.ok(result.VersionId);
  t.ok(result.Location);
  t.ok(result.Key);
  t.ok(result.Bucket);
  t.end();
});

tap.test('exists', async t => {
  const result = await s3.exists('key1');
  t.ok(result);
  t.end();
});

tap.test('get', async t => {
  const result = JSON.parse((await s3.get('key1')).Body.toString());
  t.match(result, 'some text');
  t.end();
});

tap.test('get with version', async t => {
  const putResult = await s3.put('key1', 'some text');
  const result = JSON.parse((await s3.get('key1', putResult.VersionId)).Body.toString());
  t.match(result, 'some text');
  t.end();
});

tap.test('list', async t => {
  const result = await s3.list();
  t.equal(result.Contents.length, 1);
  t.match(result.Contents[0], {
    Key: 'key1',
  });
  t.end();
});

tap.test('listVersion', async t => {
  // make a published version:
  const putResult = await s3.put('key1.published', {
    v1: 'this is the published version',
    published: true
  });
  const result = await s3.listVersions('key1');
  t.equal(result.length, 15);
  const publishedResult = await s3.listVersions('key1', 'key1.published');
  t.equal(publishedResult.length, 16);
  t.equal(publishedResult[publishedResult.length - 1].published, true);
  t.end();
});

tap.test('get JSON', async t => {
  await s3.put('key1', {
    v1: true,
    v2: 'v2'
  });
  const result = await s3.get('key1');
  t.match(result, {
    v1: true,
    v2: 'v2'
  });
  t.end();
});

tap.test('get with fallback', async t => {
  const result = await s3.get('no exist', false, { v1: 76 });
  t.match(result, {
    v1: 76
  });
  t.end();
});

tap.test('getBulk', async t => {
  const result = await s3.getBulk(['key1', 'key1.published', 'key1.json'], false, { v1: 76 });
  t.match(result, [
    { v1: true, v2: 'v2' },
    { v1: 'this is the published version', published: true },
    { v1: 76 }]);
  t.end();
});

tap.test('delete', async t => {
  const result = await s3.delete('key1');
  t.equal(result, 16);
  const publishedResult = await s3.delete('key1.published');
  t.equal(publishedResult, 1);
  t.end();
});
