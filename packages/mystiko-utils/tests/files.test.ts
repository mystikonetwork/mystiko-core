import fs from 'fs';
import path from 'path';
import os from 'os';
import pako from 'pako';
import { readCompressedFile, readFile, readJsonFile } from '../src';

test('Test readFile', async () => {
  const data = await readFile('https://google.com');
  expect(data.length).toBeGreaterThan(0);
});

test('Test readCompressedFile', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'utilsTest'));
  const uncompressedFile = path.join(os.tmpdir(), 'uncompressed.txt');
  const compressedFile = path.join(os.tmpdir(), 'compressed.gz');
  fs.writeFileSync(uncompressedFile, 'hello world');
  fs.writeFileSync(compressedFile, pako.deflate('hello world'));
  expect((await readCompressedFile(uncompressedFile)).toString()).toBe('hello world');
  expect((await readCompressedFile(compressedFile)).toString()).toBe('hello world');
  fs.rmSync(tmpDir, { recursive: true });
});

test('Test readJsonFile', async () => {
  const data = await readJsonFile(['tests/files.non-exist.json', 'tests/files.test.json']);
  expect(data.test).toBe(true);
  await expect(
    readJsonFile(['tests/files.non-exist.json', 'tests/files.non-exist-1.json']),
  ).rejects.toThrow();
});
