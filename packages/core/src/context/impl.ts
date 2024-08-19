import { MystikoConfig } from '@mystikonetwork/config';
import { MystikoContractFactory, SupportedContractType } from '@mystikonetwork/contracts-abi';
import { MystikoDatabase } from '@mystikonetwork/database';
import { ProviderPool } from '@mystikonetwork/ethers';
import { IRelayerHandler as GasRelayers } from '@mystikonetwork/gas-relayer-client';
import { IScreeningClient } from '@mystikonetwork/screening-client';
import { MystikoProtocol } from '@mystikonetwork/protocol';
import { ethers } from 'ethers';
import { createError, MystikoErrorCode } from '../error';
import {
  AccountHandler,
  AssetHandler,
  ChainHandler,
  CommitmentHandler,
  ContractHandler,
  DepositHandler,
  ExecutorFactory,
  MystikoContextInterface,
  MystikoContractConnector,
  NullifierHandler,
  TransactionHandler,
  WalletHandler,
} from '../interface';

export class MystikoContext<
  A extends AccountHandler = AccountHandler,
  AS extends AssetHandler = AssetHandler,
  CH extends ChainHandler = ChainHandler,
  CO extends ContractHandler = ContractHandler,
  CM extends CommitmentHandler = CommitmentHandler,
  D extends DepositHandler = DepositHandler,
  N extends NullifierHandler = NullifierHandler,
  T extends TransactionHandler = TransactionHandler,
  W extends WalletHandler = WalletHandler,
  P extends MystikoProtocol = MystikoProtocol,
> implements MystikoContextInterface<A, AS, CH, CO, CM, D, N, T, W, P>
{
  private accountHandler?: A;

  private assetHandler?: AS;

  private chainHandler?: CH;

  private contractHandler?: CO;

  private commitmentHandler?: CM;

  private depositHandler?: D;

  private nullifierHandler?: N;

  private transactionHandler?: T;

  private walletHandler?: W;

  private executorFactory?: ExecutorFactory;

  private providerPool?: ProviderPool;

  private gasRelayerClient?: GasRelayers;

  private screeningClient?: IScreeningClient;

  public config: MystikoConfig;

  public db: MystikoDatabase;

  public protocol: P;

  public contractConnector: MystikoContractConnector;

  constructor(config: MystikoConfig, db: MystikoDatabase, protocol: P) {
    this.config = config;
    this.db = db;
    this.protocol = protocol;
    this.contractConnector = {
      connect<CT extends SupportedContractType>(
        contractName: string,
        address: string,
        signerOrProvider: ethers.Signer | ethers.providers.Provider,
      ): CT {
        return MystikoContractFactory.connect<CT>(contractName, address, signerOrProvider);
      },
    };
  }

  public get accounts(): A {
    if (!this.accountHandler) {
      throw createError('account handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.accountHandler;
  }

  public set accounts(accountHandler: A) {
    this.accountHandler = accountHandler;
  }

  public get assets(): AS {
    if (!this.assetHandler) {
      throw createError('asset handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.assetHandler;
  }

  public set assets(accountHandler: AS) {
    this.assetHandler = accountHandler;
  }

  public get chains(): CH {
    if (!this.chainHandler) {
      throw createError('chain handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.chainHandler;
  }

  public set chains(commitmentHandler: CH) {
    this.chainHandler = commitmentHandler;
  }

  public get contracts(): CO {
    if (!this.contractHandler) {
      throw createError('contract handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.contractHandler;
  }

  public set contracts(contractHandler: CO) {
    this.contractHandler = contractHandler;
  }

  public get commitments(): CM {
    if (!this.commitmentHandler) {
      throw createError('commitment handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.commitmentHandler;
  }

  public set commitments(commitmentHandler: CM) {
    this.commitmentHandler = commitmentHandler;
  }

  public get deposits(): D {
    if (!this.depositHandler) {
      throw createError('deposit handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.depositHandler;
  }

  public set deposits(depositHandler: D) {
    this.depositHandler = depositHandler;
  }

  public get nullifiers(): N {
    if (!this.nullifierHandler) {
      throw createError('nullifier handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.nullifierHandler;
  }

  public set nullifiers(nullifierHandler: N) {
    this.nullifierHandler = nullifierHandler;
  }

  public get transactions(): T {
    if (!this.transactionHandler) {
      throw createError('transaction handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.transactionHandler;
  }

  public set transactions(transactionHandler: T) {
    this.transactionHandler = transactionHandler;
  }

  public get wallets(): W {
    if (!this.walletHandler) {
      throw createError('wallet handler has not been set', MystikoErrorCode.NO_HANDLER);
    }
    return this.walletHandler;
  }

  public set wallets(walletHandler: W) {
    this.walletHandler = walletHandler;
  }

  public get executors(): ExecutorFactory {
    if (!this.executorFactory) {
      throw createError('executor factory has not been set', MystikoErrorCode.NO_EXECUTOR);
    }
    return this.executorFactory;
  }

  public set executors(factory: ExecutorFactory) {
    this.executorFactory = factory;
  }

  public get providers(): ProviderPool {
    if (!this.providerPool) {
      throw createError('provider pool has not been set', MystikoErrorCode.NO_PROVIDER_POOL);
    }
    return this.providerPool;
  }

  public set providers(pool: ProviderPool) {
    this.providerPool = pool;
  }

  public get gasRelayers(): GasRelayers {
    if (!this.gasRelayerClient) {
      throw createError('gas relayer client has not been set', MystikoErrorCode.NO_GAS_RELAYER_CLIENT);
    }
    return this.gasRelayerClient;
  }

  public set gasRelayers(gasRelayerHandler: GasRelayers) {
    this.gasRelayerClient = gasRelayerHandler;
  }

  public get screening(): IScreeningClient {
    if (!this.screeningClient) {
      throw createError('screening client has not been set', MystikoErrorCode.NO_SCREENING_CLIENT);
    }
    return this.screeningClient;
  }

  public set screening(client: IScreeningClient) {
    this.screeningClient = client;
  }
}
