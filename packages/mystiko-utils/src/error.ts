export interface EtherError extends Error {
  reason?: string;
  code?: string;
}

/**
 * @function module:mystiko/utils.errorMessage
 * @desc get error message from the caught error.
 * @param {any} error the error object.
 * @returns {string} error message.
 */
export function errorMessage(error: any): string {
  if (!error) {
    return '';
  }
  if (error instanceof Error) {
    const convertedError = error as EtherError;
    let message;
    if (convertedError.reason) {
      message = convertedError.reason;
    } else if (convertedError.message) {
      message = convertedError.message;
    } else {
      message = convertedError.toString();
    }
    if (convertedError.code) {
      return `[${convertedError.code}] ${message}`;
    }
    return message;
  }
  if (error instanceof Object) {
    return JSON.stringify(error);
  }
  return error.toString();
}
