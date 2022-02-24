/**
 * @function module:mystiko/utils.check
 * @desc check whether given condition holds. If condition fails, it raises Error with given message.
 * @param {boolean} condition an evaluating expression.
 * @param {string} message to throw if condition fails.
 */
export function check(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * @function module:mystiko/utils.checkNotNull
 * @desc check given arg is not null, if it is null, raise Error with given message.
 * @param {any} arg any object.
 * @param {string} message to throw if arg is null.
 */
export function checkNotNull(arg: any, message: string) {
  check(arg !== null, message);
}

/**
 * @function module:mystiko/utils.checkDefined
 * @desc check given arg is defined, if it is undefined, raise Error with given message.
 * @param {any} arg any object.
 * @param {string} message to throw if arg is undefined.
 */
export function checkDefined(arg: any, message: string) {
  check(arg !== undefined, message);
}

/**
 * @function module:mystiko/utils.checkDefinedAndNotNull
 * @desc check given arg is defined and not null, if it is null or undefined, raise Error with given message.
 * @param {any} arg any object.
 * @param {string} message to throw if arg is null or undefined.
 */
export function checkDefinedAndNotNull(arg: any, message: string) {
  checkNotNull(arg, message);
  checkDefined(arg, message);
}
