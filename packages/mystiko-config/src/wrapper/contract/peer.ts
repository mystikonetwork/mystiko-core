import { BaseConfig } from '../base';
import { RawPeerContractConfig } from '../../raw';

export class PeerContractConfig extends BaseConfig<RawPeerContractConfig> {
  public get chainId(): number {
    return this.data.chainId;
  }

  public get address(): string {
    return this.data.address;
  }
}
