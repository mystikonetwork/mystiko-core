import { ethers } from 'ethers';

const executionRevertedRegex = /"execution reverted: ([^\\?"]+)\\?"/;

export interface EtherError {
  reason?: string;
  message?: string;
  code?: string | number;
  data?: { code: number; message: string };
  receipt?: ethers.providers.TransactionReceipt;
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
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof String) {
    return error.toString();
  }
  const convertedError = error as EtherError;
  let message;
  if (convertedError.data) {
    message = convertedError.data.message;
  } else if (convertedError.reason || convertedError.message) {
    const groups = executionRevertedRegex.exec(convertedError.message || '');
    if (convertedError.message && groups) {
      [, message] = groups;
    } else if (convertedError.reason) {
      message = convertedError.reason;
    } else {
      message = convertedError.message;
    }
  } else if (error instanceof Error) {
    message = error.toString();
  }
  if (message) {
    if (convertedError.code && typeof convertedError.code === 'string') {
      if (convertedError.code === ethers.errors.CALL_EXCEPTION) {
        message = `${message}, please check block explorer for more information`;
      } else {
        message = `[${convertedError.code}] ${message}`;
      }
    }
  } else {
    message = JSON.stringify(error);
  }
  return message;
}
