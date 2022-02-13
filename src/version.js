export const VERSION = '0.0.1';
export const VERSION_REGEX = /^\d+\.\d+\.\d+$/;
export function isValidVersion(version) {
  if (typeof version === 'string' || version instanceof String) {
    return !!version.match(VERSION_REGEX);
  }
  return false;
}
