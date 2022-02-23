import pako from 'pako';
import * as fastfile from 'fastfile';

/**
 * @function module:mystiko/utils.readFile
 * @desc read a file's whole content with given path.
 * @param {string} path file's path, it could be a URL or a file system path.
 * @param {number|undefined} [cacheSize] cache size for this file.
 * @param {number|undefined} [pageSize] page size for this file.
 * @returns {Promise<Buffer>} check {@link https://nodejs.org/api/buffer.html Node.js Buffer}
 */
export async function readFile(path: string, cacheSize?: number, pageSize?: number): Promise<Buffer> {
  const fd = await fastfile.readExisting(path, cacheSize, pageSize);
  const data = await fd.read(fd.totalSize);
  await fd.close();
  return Buffer.from(data);
}

/**
 * @function module:mystiko/utils.readCompressedFile
 * @desc read file with gz extension and decompress it. If the path is not ended with gz, it returns original file.
 * @param {string} path file's path, it could be a URL or a file system path.
 * @param {number|undefined} [cacheSize] cache size for this file.
 * @param {number|undefined} [pageSize] page size for this file.
 * @returns {Object} decompressed file if the path is ended with gz, otherwise it returns original file.
 */
export async function readCompressedFile(
  path: string,
  cacheSize?: number,
  pageSize?: number,
): Promise<Buffer> {
  if (path.endsWith('.gz')) {
    const data = await readFile(path, cacheSize, pageSize);
    return Buffer.from(pako.inflate(data));
  }
  return readFile(path, cacheSize, pageSize);
}

/**
 * @function module:mystiko/utils.readJsonFile
 * @desc read a file's whole content with given path, and parse it as JSON.
 * @param {string} path file's path, it could be a URL or a file system path.
 * @param {number|undefined} [cacheSize] cache size for this file.
 * @param {number|undefined} [pageSize] page size for this file.
 * @returns {Object} parsed JSON object.
 */
export async function readJsonFile(path: string, cacheSize?: number, pageSize?: number): Promise<any> {
  const data = await readCompressedFile(path, cacheSize, pageSize);
  return JSON.parse(data.toString());
}
