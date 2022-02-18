## @mystiko/contracts
This package contains the Smart Contract written in Solidity

### Deploy Smart Contracts
#### Deploy Step 1
deploy hash contract and verifier contract, parameter:

```
   network           : testnet 、 mainnet)
   step              : step1
```
example:

```yarn deploy:bsctestnet  testnet  step1```

#### Deploy Step 2
deploy mystiko core contract, parameter
```
 mystiko network     : testnet、mainnet)
 step                : step2
 bridge name         : tbridge、celer、poly
 destination network : ropsten、bsctestnet ...
 token name          : ETH、MTT、mUSD、BNB...

```
example:

``` yarn deploy:bsctestnet  testnet  step2 celer goerli ETH```

#### Deploy Step 3
configure peer contract address, parameter:

```
 mystiko network     : testnet、mainnet)
 step                : step3
 bridge name         : tbridge、celer、poly
 destination network : ropsten、bsctestnet ...
 token name          : ETH、MTT、mUSD、BNB...

```
example:

``` yarn deploy:bsctestnet  testnet  step3 celer goerli ETH```
