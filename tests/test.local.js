const Storage = require('../index');
const tap = require('tap');
const fs = require('fs');

const s3 = new Storage({
  root: `${__dirname}/db`
});

tap.test('put', async t => {
  const result = await s3.put('key1', {
    v1: true,
    v2: 'v2'
  });
  t.ok(result.VersionId);
  t.ok(result.Location);
  t.ok(result.Key);
  t.ok(fs.existsSync(`${s3.config.root}/key1`));
  t.end();
});

tap.test('put with folder', async t => {
  const result = await s3.put('folder1/key1', {
    folder: true,
  });
  t.equal(result.Key, 'folder1/key1');
  t.ok(fs.existsSync(`${s3.config.root}/folder1##key1`));
  t.end();
});

tap.test('exists', async t => {
  t.ok(await s3.exists('key1'));
  t.ok(await s3.exists('folder1/key1'));
  t.end();
});

tap.test('get', async t => {
  const result = JSON.parse((await s3.get('key1')).Body.toString());
  t.match(result, {
    v1: true,
    v2: 'v2'
  });
  t.end();
});

tap.test('get with folder', async t => {
  const result = JSON.parse((await s3.get('folder1/key1')).Body.toString());
  t.match(result, {
    folder: true
  });
  t.end();
});

tap.test('list', async t => {
  const result = await s3.list();
  t.equal(result.Contents.length, 2);
  t.match(result.Contents[0], {
    Key: 'folder1',
  });
  t.match(result.Contents[1], {
    Key: 'key1',
  });
});

tap.test('list with folders', async t => {
  const folderResult = await s3.list('folder1');
  t.equal(folderResult.CommonPrefixes.length, 1);
  t.match(folderResult.CommonPrefixes[0], {
    Prefix: '/key1'
  });
  await s3.put('folder1/subfolder1/key1');
  const subfolderResult = await s3.list('folder1');
  t.equal(subfolderResult.CommonPrefixes.length, 2);
  t.match(subfolderResult.CommonPrefixes[0], {
    Prefix: '/key1'
  });
  t.match(subfolderResult.CommonPrefixes[1], {
    Prefix: '/subfolder1/key1'
  });
  t.end();
});

tap.test('get JSON', async t => {
  await s3.put('key1.json', {
    v1: true,
    v2: 'v2'
  });
  const result = await s3.get('key1.json');
  t.match(result, {
    v1: true,
    v2: 'v2'
  });
  t.end();
});

tap.test('delete', async t => {
  const result = await s3.delete('key1');
  t.equal(result, 2);
  t.notOk(fs.existsSync(`${s3.config.root}/key1`));
  t.end();
});

tap.test('delete subfolder', async t => {
  const result = await s3.delete('folder1/subfolder1');
  t.equal(result, 1);
  t.notOk(fs.existsSync(`${s3.config.root}/folder1/subfolder1/key1`));
  const topResult = await s3.delete('folder1');
  t.equal(topResult, 1);
  t.notOk(fs.existsSync(`${s3.config.root}/folder1/subfolder1/key1`));
  t.end();
});
