import BN from 'bn.js';
import { ethers, ContractInterface } from 'ethers';
import { MystikoABI, AssetType } from '@mystikonetwork/config';
import { toBN } from '@mystikonetwork/utils';
import { Contract } from '../model';

/**
 * @class MystikoContract
 * @param {Contract | ethers.Contract} contract configuration of this contract.
 * @desc a wrapped contract object with ethers.Contract and
 * ContractConfig.
 */
export class MystikoContract {
  private config?: Contract;

  private contract?: ethers.Contract;

  constructor(contract: Contract | ethers.Contract) {
    if (contract instanceof Contract) {
      this.config = contract;
    }
    if (contract instanceof ethers.Contract) {
      this.contract = contract;
    }
  }

  /**
   * @desc connect this contract with given provider or signer.
   * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner an instance of
   * ethers.providers.Provider or ethers.Signer.
   * @param {Function} [contractGenerator] for constructing smart contract instance,
   * if not provided, it will generate ethers.Contract.
   * @returns {ethers.Contract} constructed ethers.Contract.
   */
  public connect(
    providerOrSigner: ethers.providers.Provider | ethers.Signer,
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
  ): ethers.Contract {
    let cGenerator: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract;
    if (!contractGenerator) {
      cGenerator = (address, abi, pOrS) => new ethers.Contract(address, abi, pOrS);
    } else {
      cGenerator = contractGenerator;
    }
    if (this.contract) {
      return this.contract.connect(providerOrSigner);
    }
    if (!!this.config?.address && !!this.config?.abi) {
      this.contract = cGenerator(this.config.address, this.config.abi as ContractInterface, providerOrSigner);
      return this.contract;
    }
    throw new Error('config is not properly set');
  }

  /**
   * @desc get current asset balance of this contract.
   * @param {Function} [contractGenerator] for constructing smart contract instance,
   * if not provided, it will generate ethers.Contract.
   * @returns {Promise<BN>} a BN instance which is the current balance of this contract.
   */
  public async assetBalance(
    contractGenerator?: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract,
  ): Promise<BN> {
    if (!this.contract?.provider && !this.contract?.signer) {
      throw new Error('this contract is not connected with provider or signer');
    }
    const providerOrSigner = this.contract.provider ? this.contract.provider : this.contract.signer;
    let cGenerator: (
      address: string,
      abi: ContractInterface,
      providerOrSigner: ethers.providers.Provider | ethers.Signer,
    ) => ethers.Contract;
    if (!contractGenerator) {
      cGenerator = (address, abi, pOrS) => new ethers.Contract(address, abi, pOrS);
    } else {
      cGenerator = contractGenerator;
    }
    let balance = toBN(0);
    if (this.config?.address && this.config?.assetAddress && this.config?.assetType === AssetType.ERC20) {
      const erc20Contract = cGenerator(this.config.assetAddress, MystikoABI.ERC20.abi, providerOrSigner);
      const balanceRaw = await erc20Contract.balanceOf(this.config.address);
      balance = toBN(balanceRaw.toString());
    } else if (this.config?.address && this.config?.assetType === AssetType.MAIN) {
      const balanceRaw = await providerOrSigner.getBalance(this.config.address);
      balance = toBN(balanceRaw.toString());
    }
    return balance;
  }

  public get rawContract(): ethers.Contract | undefined {
    return this.contract;
  }

  public getConfig(): Contract | undefined {
    return this.config;
  }
}
