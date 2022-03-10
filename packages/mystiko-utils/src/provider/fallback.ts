import { ethers } from 'ethers';
import { check } from '../check';
import { EtherError } from '../error';
import { TimeoutError } from '../promise';

function checkNetworks(networks: Array<ethers.providers.Network>): ethers.providers.Network | undefined {
  let result: ethers.providers.Network | undefined;
  for (let i = 0; i < networks.length; i += 1) {
    const network = networks[i];
    if (result) {
      if (result.chainId !== network.chainId) {
        throw new Error('providers network mismatch');
      }
    } else {
      result = network;
    }
  }
  return result;
}

export default class FallbackProvider extends ethers.providers.BaseProvider {
  private readonly rawProviders: ethers.providers.BaseProvider[];

  constructor(providers: ethers.providers.BaseProvider[]) {
    check(providers.length > 0, 'providers cannot be empty');
    const networks: ethers.providers.Network[] = providers.map((provider) => (<any>provider).network);
    let networkOrReady: ethers.providers.Network | Promise<ethers.providers.Network> | undefined =
      checkNetworks(networks);
    if (!networkOrReady) {
      networkOrReady = new Promise((resolve, reject) => {
        setTimeout(() => {
          this.detectNetwork().then(resolve, reject);
        }, 0);
      });
    }
    super(networkOrReady);
    this.rawProviders = providers;
  }

  public detectNetwork(): Promise<ethers.providers.Network> {
    return this.detectNetworkRecursively(0);
  }

  public perform(method: string, params: any): Promise<any> {
    return this.performRecursively(method, params, 0);
  }

  public get providers(): ethers.providers.BaseProvider[] {
    return this.rawProviders;
  }

  private detectNetworkRecursively(index: number): Promise<ethers.providers.Network> {
    const rawProvider = this.rawProviders[index];
    return rawProvider.detectNetwork().catch((error: any) => {
      if (error instanceof Error) {
        if (index < this.rawProviders.length - 1) {
          return this.detectNetworkRecursively(index + 1);
        }
      }
      return Promise.reject(error);
    });
  }

  private performRecursively(method: string, params: any, index: number): Promise<any> {
    const rawProvider = this.rawProviders[index];
    return rawProvider.perform(method, params).catch((error: any) => {
      if (error instanceof Error) {
        if (index < this.rawProviders.length - 1 && FallbackProvider.isRetryable(error)) {
          return this.performRecursively(method, params, index + 1);
        }
      }
      return Promise.reject(error);
    });
  }

  private static isRetryable(error: Error): boolean {
    if (error instanceof TimeoutError) {
      return true;
    }
    const etherError = error as EtherError;
    switch (etherError.code) {
      case ethers.errors.SERVER_ERROR:
      case ethers.errors.TIMEOUT:
      case ethers.errors.UNKNOWN_ERROR:
      case ethers.errors.UNSUPPORTED_OPERATION:
      case ethers.errors.NETWORK_ERROR:
        return true;
      default:
        return false;
    }
  }
}
