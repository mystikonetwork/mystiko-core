###step1
deploy hash contract and verifier contract, parameter:

```
   network           : testnet 、 mainnet)
   step              : step1
```
example:

```yarn deploy:bsctestnet  testnet  step1```

###step2
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

###step3
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
