import { validate } from 'class-validator';

/**
 * @enum BridgeType
 * @desc all supported cross-chain bridges.
 * @property {string} LOOP a loop bridge indicates no cross-chain needed.
 * The deposits and withdraws happens on the same blockchain.
 * @property {string} POLY the {@link https://poly.network Poly Bridge} cross-chain network.
 */
export enum BridgeType {
  LOOP = 'loop',
  POLY = 'poly',
  TBRIDGE = 'tbridge',
  CELER = 'celer',
}

/**
 * @enum AssetType
 * @desc all supported asset types.
 * @property {string} ERC20 the {@link https://ethereum.org/en/developers/docs/standards/tokens/erc-20/ ERC20 Token}
 * standard.
 * @property {string} MAIN main asset type of the blockchains, e.g. ETH/BNB
 */
export enum AssetType {
  ERC20 = 'erc20',
  MAIN = 'main',
}

export enum ContractType {
  DEPOSIT = 'deposit',
  POOL = 'pool',
}

export enum CircuitType {
  ROLLUP1 = 'rollup1',
  ROLLUP4 = 'rollup4',
  ROLLUP16 = 'rollup16',
  TRANSACTION1x0 = 'transaction1x0',
  TRANSACTION1x1 = 'transaction1x1',
  TRANSACTION1x2 = 'transaction1x2',
  TRANSACTION2x0 = 'transaction2x0',
  TRANSACTION2x1 = 'transaction2x1',
  TRANSACTION2x2 = 'transaction2x2',
}

/**
 * @function module:mystiko/models.isValidBridgeType
 * @desc check whether given type is one of the supported bridge types.
 * @param {string} type bridge type to be checked.
 * @returns {boolean} true if the type is supported, otherwise returns false.
 */
export function isValidBridgeType(type: BridgeType): boolean {
  return Object.values(BridgeType).includes(type);
}

/**
 * @function module:mystiko/models.isValidAssetType
 * @desc check whether given type is one of the supported asset types.
 * @param {string} type bridge type to be checked.
 * @returns {boolean} true if the type is supported, otherwise returns false.
 */
export function isValidAssetType(type: AssetType): boolean {
  return Object.values(AssetType).includes(type);
}

export function isValidContractType(type: ContractType): boolean {
  return Object.values(ContractType).includes(type);
}

export function isValidCircuitType(type: CircuitType): boolean {
  return Object.values(CircuitType).includes(type);
}

export function validateObject<T extends Object>(object: T): Promise<T> {
  return validate(object, { forbidUnknownValues: true }).then((errors) => {
    if (errors.length > 0) {
      return Promise.reject(new Error(`failed to validate config object:\n ${errors}`));
    }
    return object;
  });
}
