export const VERSION = '0.0.4';
export const VERSION_REGEX = /^\d+\.\d+\.\d+$/;
export function isValidVersion(version: string | String): boolean {
  return !!version.match(VERSION_REGEX);
}
