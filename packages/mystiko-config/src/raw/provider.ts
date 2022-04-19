import { Expose } from 'class-transformer';
import { IsInt, IsPositive, IsUrl } from 'class-validator';

export class RawProviderConfig {
  @Expose()
  @IsUrl({ protocols: ['http', 'https', 'ws', 'wss'], require_tld: false })
  public url: string;

  @Expose()
  @IsInt()
  @IsPositive()
  public timeoutMs: number = 5000;

  @Expose()
  @IsInt()
  @IsPositive()
  public maxTryCount: number = 3;
}
