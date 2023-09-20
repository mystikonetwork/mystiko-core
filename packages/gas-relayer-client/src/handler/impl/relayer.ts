import { MystikoContractFactory, MystikoGasRelayer } from '@mystikonetwork/gas-relayer-contracts-abi';
import {
  ChainStatus,
  RegisterInfo,
  TransactResponse,
  TransactStatus,
  TransactStatusEnum,
} from '@mystikonetwork/gas-relayer-config';
import { promiseWithTimeout } from '@mystikonetwork/utils';
import { IRelayerHandler } from '../../interface';
import { Handler } from '../handler';
import { RelayerError, RelayerErrorCode, RelayTransactRequest, WaitingJobRequest } from '../../types';
import { GetJobStatusRequest, GetRegisterRequest } from '../../types/register';
import { Request } from '../../axios';

export class RelayerHandler extends Handler implements IRelayerHandler {
  async registerInfo(request: GetRegisterRequest): Promise<RegisterInfo[]> {
    const { chainId } = request;
    if (!chainId) {
      return Promise.reject(new RelayerError(RelayerErrorCode.PARAM_ERROR, 'chain id can not be null'));
    }

    const provider = await this.providers.getProvider(chainId);
    if (!provider) {
      return Promise.reject(
        new RelayerError(RelayerErrorCode.GET_PROVIDER_ERROR, `cannot get provider for chainId=${chainId}`),
      );
    }

    const chainConfig = this.relayerConfig.getChainConfig(chainId);
    if (!chainConfig) {
      return Promise.reject(
        new RelayerError(
          RelayerErrorCode.GET_CHAIN_CONFIG_ERROR,
          `cannot get relayer chain config for chainId=${chainId}`,
        ),
      );
    }

    const contract = MystikoContractFactory.connect<MystikoGasRelayer>(
      'MystikoGasRelayer',
      chainConfig.relayerContractAddress,
      provider,
    );

    const relayerInfo = await contract.getAllRelayerInfo();
    const urls = relayerInfo[0];
    const names = relayerInfo[1];
    const relayers = relayerInfo[2];

    let registers: RegisterInfo[] = [];

    const relayerPromise: Promise<void>[] = [];

    for (let i = 0; i < urls.length; i += 1) {
      const server = new Request({
        baseURL: urls[i],
        timeout: this.defaultTimeoutMs,
      });

      const register: RegisterInfo = {
        registerUrl: urls[i],
        registerName: 'unknown',
        relayerAddress: 'unknown',
        support: false,
        available: false,
      };

      const status = server
        .post<ChainStatus>('status', request)
        .then((res) => {
          if (res.data.code === 0) {
            const chainStatus = res.data.data;
            register.registerName = names[i];
            register.relayerAddress = relayers[i];
            register.chainId = chainStatus.chainId;
            if (chainStatus.support) {
              register.support = chainStatus.support;
              register.available = chainStatus.available;
              register.relayerContractAddress = chainStatus.relayerContractAddress;
              register.contracts = chainStatus.contracts;
            }
          }
        })
        .catch((err) => {
          this.logger.error(`get chain status got error: ${err}`);
        })
        .finally(() => {
          registers.push(register);
          return Promise.resolve();
        });

      relayerPromise.push(status);
    }

    await Promise.all(relayerPromise);

    if (!request.options?.showUnavailable) {
      registers = registers.filter((register) => register.available);
    }

    return registers;
  }

  jobStatus(request: GetJobStatusRequest): Promise<TransactStatus> {
    const server = new Request({
      baseURL: request.registerUrl,
      timeout: this.defaultTimeoutMs,
    });
    return server
      .get<TransactStatus>(`jobs/${request.jobId}`, { params: { chainId: request.options?.chainId } })
      .then((res) => {
        if (res.data.code !== 0) {
          return Promise.reject(new RelayerError(res.data.code, res.data.message));
        }
        return Promise.resolve(res.data.data);
      });
  }

  relayTransact(request: RelayTransactRequest): Promise<TransactResponse> {
    this.logger.debug('gas relayer send transact');
    this.logger.debug(JSON.stringify(request, null, ' '));

    const server = new Request({
      baseURL: request.relayerUrl,
      timeout: this.defaultTimeoutMs,
    });

    return server.post<TransactResponse>('transact', request.transactRequest).then((res) => {
      if (res.data.code !== 0) {
        return Promise.reject(new RelayerError(res.data.code, res.data.message));
      }
      return Promise.resolve(res.data.data);
    });
  }

  async waitUntilConfirmed(request: WaitingJobRequest): Promise<TransactStatus> {
    let timer: NodeJS.Timeout | undefined;

    const { registerUrl, jobId } = request;
    const timeoutMs = request.options?.timeoutMs ?? this.defaultTimeoutMs;
    const intervalMs = request.options?.intervalMs ?? this.defaultIntervalMs;

    const promise = new Promise<TransactStatus>((resolve, reject) => {
      timer = setInterval(() => {
        this.jobStatus({ registerUrl, jobId }).then((jobStatus: TransactStatus) => {
          const { status } = jobStatus;
          if (status === TransactStatusEnum.CONFIRMED) {
            resolve(jobStatus);
          }
          if (status === TransactStatusEnum.FAILED) {
            reject(jobStatus);
          }
        });
      }, intervalMs);
    });

    return promiseWithTimeout<TransactStatus>(promise, timeoutMs).finally(() => {
      if (timer) {
        clearInterval(timer);
      }
    });
  }
}
