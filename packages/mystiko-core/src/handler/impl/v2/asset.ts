import { BridgeConfigType, BridgeType } from '@mystikonetwork/config';
import { Chain, Commitment, CommitmentStatus } from '@mystikonetwork/database';
import { fromDecimals } from '@mystikonetwork/utils';
import { MystikoContext } from '../../../context';
import { MystikoHandler } from '../../handler';
import {
  AssetBalance,
  AssetBalanceOptions,
  AssetHandler,
  AssetMultipleBalanceOptions,
} from '../../../interface/handler';

export class AssetHandlerV2 extends MystikoHandler implements AssetHandler {
  constructor(context: MystikoContext) {
    super(context);
    this.context.assets = this;
  }

  public assets(chainId: number): Promise<string[]> {
    return this.getCommitments([CommitmentStatus.INCLUDED], { chainId }).then((commitments) => {
      const assetSymbols = new Set<string>(commitments.map((c) => c.assetSymbol));
      return Array.from(assetSymbols.values());
    });
  }

  public balance(options: AssetBalanceOptions): Promise<AssetBalance> {
    const multiOptions: AssetMultipleBalanceOptions = {
      assets: [options.asset],
      chainId: options.chainId,
      bridgeType: options.bridgeType,
      shieldedAddress: options.shieldedAddress,
      contractAddress: options.contractAddress,
    };
    return this.balances(multiOptions).then((multiBalances) => {
      const balance = multiBalances.get(options.asset);
      if (balance) {
        return balance;
      }
      return { unspentTotal: 0, pendingTotal: 0 };
    });
  }

  public balances(options?: AssetMultipleBalanceOptions): Promise<Map<string, AssetBalance>> {
    return this.getCommitments(
      [CommitmentStatus.SRC_SUCCEEDED, CommitmentStatus.QUEUED, CommitmentStatus.INCLUDED],
      options,
    ).then((commitments) => {
      const assets = new Map<string, Commitment[]>();
      const balances = new Map<string, AssetBalance>();
      commitments.forEach((commitment) => {
        const assetCommitments = assets.get(commitment.assetSymbol);
        if (assetCommitments) {
          assetCommitments.push(commitment);
        } else {
          assets.set(commitment.assetSymbol, [commitment]);
        }
      });
      assets.forEach((assetCommitments, assetSymbol) => {
        const unspentTotal = this.calculateCommitmentAmountTotal(
          assetCommitments.filter((c) => c.status === CommitmentStatus.INCLUDED),
        );
        const pendingTotal = this.calculateCommitmentAmountTotal(
          assetCommitments.filter((c) => c.status !== CommitmentStatus.INCLUDED),
        );
        balances.set(assetSymbol, { unspentTotal, pendingTotal });
      });
      return balances;
    });
  }

  public bridges(chainId: number, assetSymbol: string): Promise<BridgeConfigType[]> {
    return this.getCommitments([CommitmentStatus.INCLUDED], { assets: [assetSymbol], chainId }).then(
      (commitments) => {
        const bridgeTypes = new Set<BridgeType>(commitments.map((c) => c.bridgeType as BridgeType));
        const bridgeConfigs: BridgeConfigType[] = [];
        bridgeTypes.forEach((bridgeType) => {
          const bridgeConfig = this.config.getBridgeConfig(bridgeType);
          if (bridgeConfig) {
            bridgeConfigs.push(bridgeConfig);
          }
        });
        return bridgeConfigs;
      },
    );
  }

  public chains(): Promise<Chain[]> {
    return this.getCommitments([CommitmentStatus.INCLUDED])
      .then((commitments) => {
        const chainIds = new Set<number>(commitments.map((c) => c.chainId));
        const chainPromises: Promise<Chain | null>[] = [];
        chainIds.forEach((chainId) => {
          chainPromises.push(this.context.chains.findOne(chainId));
        });
        return Promise.all(chainPromises);
      })
      .then((chains: Array<Chain | null>) => {
        const filteredChains: Chain[] = [];
        chains.forEach((chain) => {
          if (chain) {
            filteredChains.push(chain);
          }
        });
        return filteredChains;
      });
  }

  private defaultShieldedAddresses(): Promise<string[]> {
    return this.context.accounts
      .find()
      .then((accounts) => accounts.map((account) => account.shieldedAddress));
  }

  private getCommitments(
    statues?: CommitmentStatus[],
    options?: AssetMultipleBalanceOptions,
  ): Promise<Commitment[]> {
    return this.defaultShieldedAddresses().then((defaultShieldedAddresses) => {
      let shieldedAddresses: string[] = [];
      if (options && options.shieldedAddress) {
        const addresses =
          options.shieldedAddress instanceof Array ? options.shieldedAddress : [options.shieldedAddress];
        addresses.forEach((address) => {
          const index = defaultShieldedAddresses.indexOf(address);
          if (index >= 0) {
            shieldedAddresses.push(address);
          }
        });
      }
      if (shieldedAddresses.length === 0) {
        shieldedAddresses = defaultShieldedAddresses;
      }
      const commitmentSelector: any = {
        shieldedAddress: { $in: shieldedAddresses },
      };
      if (options && options.assets && options.assets.length > 0) {
        commitmentSelector.assetSymbol = { $in: options.assets };
      }
      if (options && options.chainId) {
        if (options.chainId instanceof Array && options.chainId.length > 0) {
          commitmentSelector.chainId = { $in: options.chainId };
        } else if (!(options.chainId instanceof Array)) {
          commitmentSelector.chainId = options.chainId;
        }
      }
      if (options && options.bridgeType) {
        if (options.bridgeType instanceof Array && options.bridgeType.length > 0) {
          commitmentSelector.bridgeType = { $in: options.bridgeType };
        } else if (!(options.bridgeType instanceof Array)) {
          commitmentSelector.bridgeType = options.bridgeType;
        }
      }
      if (options && options.contractAddress) {
        if (options.contractAddress instanceof Array && options.contractAddress.length > 0) {
          commitmentSelector.contractAddress = { $in: options.contractAddress };
        } else if (!(options.contractAddress instanceof Array)) {
          commitmentSelector.contractAddress = options.contractAddress;
        }
      }
      if (statues && statues.length > 0) {
        commitmentSelector.status = { $in: statues };
      }
      return this.context.commitments.find({ selector: commitmentSelector });
    });
  }

  private calculateCommitmentAmountTotal(commitments: Commitment[]) {
    return commitments
      .map((c) => (c.amount ? fromDecimals(c.amount, c.assetDecimals) : 0))
      .reduce((c1, c2) => c1 + c2, 0);
  }
}
