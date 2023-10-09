# gas-relayer-client

## Initialize

```typescript
import { Relayer } from "./relayer";

const relayer = new Relayer();
relayer.initialize({ isTestnet: true });
```

initialize options:

```typescript
export interface InitOptions {
  isTestnet?: boolean;
  relayerConfig?: string | RelayerConfig;
  mystikoConfig?: string | MystikoConfig;
  loggingLevel?: LogLevelDesc;
  loggingOptions?: LoglevelPluginPrefixOptions;
  handlerFactory?: IHandlerFactory;
  requestTimeout?: number;
}
```

## Interface

```typescript
export interface IRelayerHandler {
  registerInfo(request: GetRegisterRequest): Promise<RegisterInfo[]>;

  jobStatus(request: GetJobStatusRequest): Promise<JobStatus>;

  relayTransact(request: RelayTransactRequest): Promise<TransactResponse>;
}
```

## Code
```text
# success
OK = 0,

# failed
FAILED = -1,
UNKNOWN_ERROR = -2,
INTERNAL_ERROR = -3,

TRANSACT_DUPLICATED = -599,
UNPREDICTABLE_GAS_LIMIT = -598,
NETWORK_ERROR = -597,
TIMEOUT = -596,
INVALID_ARGUMENT = -595,
MISSING_ARGUMENT = -594,
UNEXPECTED_ARGUMENT = -593,
NONCE_EXPIRED = -592,
INSUFFICIENT_FUNDS = -591,
REPLACEMENT_UNDERPRICED = -590,
TRANSACTION_REPLACED = -589
UNSUPPORTED = -588,
JOB_NOT_EXIST = -587,

CLIENT_INTERNAL_ERROR = -999,
GET_PROVIDER_ERROR = -998,
GET_CHAIN_CONFIG_ERROR = -997,
```
