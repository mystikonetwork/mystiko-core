import { IsEthereumAddress, IsInt, IsPositive } from 'class-validator';
import { Expose } from 'class-transformer';

export class PeerContractConfig {
  @Expose()
  @IsInt()
  @IsPositive()
  public chainId: number;

  @Expose()
  @IsEthereumAddress()
  public address: string;
}
