## Prerequisites
Before you go through this tutorial, please make sure you have finished {@tutorial tutorial04}.

## Get the list of source chains
Before you can create a {@link Deposit} object, you have to let user choose the parameters of a deposit request.
The first parameter is the source chain id. You could call this method to get the array of source chains that we
currently support:

```javascript
var chainConfigs = mystiko.config.chains
var chainIds = chainConfigs.map((chainConfig) => chainConfig.chainId)
var chainNames = chainConfigs.map((chainConfig) => chainConfig.name)
```

You should offer this list as the source chain(from) list to your user, and let them choose one source chain.
Check {@link MystikoConfig#chains} for more information.

## Get the list of destination chains
After your user choose a source chain, you should get the list of the destination chains based on that source chain
selection. You could call this method to achieve that goal:

```javascript
// 97 is the selected source chain id.
var peerChains = mystiko.config.getPeerChains(97)
var peerChainIds = peerChains.map((chainConfig) => chainConfig.chainId)
var peerChainNames = peerChains.map((chainConfig) => chainConfig.chainId)
```

You should offer this list as the destination chain(to) list to your user, and let them choose one destination chain.
Check {@link MystikoConfig#getPeerChains} for more information.

## Get the list of asset symbols
After your user choose a source chain and a destination chain, you should get the list of the asset symbols based
on those selections. You could call this method to achieve that goal:

```javascript
// 97 is the source chain id
// 3 is the destination chain id
mystiko.config.getAssetSymbols(97, 3)
```
You should offer this list as the asset symbol list to your user, and let them choose one asset symbol.
Check {@link MystikoConfig#getAssetSymbols} for more information.

## Get the list of cross-chain bridges
After your user choose a source chain, a destination chain and an asset symbol, you should get the list of the
supported cross-chain bridges except the source chain id is equal to destination chain id. You could achieve this
by calling this method:

```javascript
// 97 is the source chain id
// 3 is the destination chain id
// 'USDT' is the asset symbol
var bridges = mystiko.config.getBridges(97, 3, 'USDT')
var bridgeNames = bridges.map((bridgeConfig) => bridgeConfig.name)
var bridgeTypes = bridges.map((bridgeConfig) => bridgeConfig.type)
```

You should offer this list as the cross-chain bridge list to your user, and let them choose one cross-chain bridge.
Check {@link MystikoConfig#getBridges} for more information.

## Create a deposit
After your user finish choosing a source chain, a destination chain, an asset symbol,
a cross-chain bridge(if necessary), deposit amount and recipient shielded address, you could create a deposit
based on these inputs. Below code is an example:

Construct the request body.
```javascript
var request = {
  srcChainId: 97,
  dstChainId: 3,
  assetSymbol: 'USDT',
  bridge: mystiko.models.BridgeType.POLY, // or mystiko.models.BridgeType.LOOP if srcChainId === dstChainId
  amount: 100,
  shieldedAddress: 'Aa9ABUws2WBSUd3WVWCkUAA13SFnyDdbPVazY2YpRUvLZuLfSAh3rtDHqXVRxWPw8pRGsPc2sQuY31J66he6a3sao'
}
```
Choose a signer.
```javascript
// signer should be connected - use this in browser
var signer = mystiko.signers.metaMask;
```
```javascript
// signer should be provided with private key - use this in Node.js console
var signer = mystiko.signers.privateKey;
```

Create the deposit transaction.
```javascript
mystiko.deposits.createDeposit(request, signer).then(({ deposit, depositPromise }) => {
  return depositPromise.then(() => {
    if (deposit.status === mystiko.models.DepositStatus.SRC_CONFIRMED) {
      console.log(`Deposit #${deposit.id} is confirmed on the source chain`)
    } else {
      console.log(`Deposit #${deposit.id} is failed, error: ${deposit.errorMessage}`)
    }
  })
})
```

The {@link DepositHandler#createDeposit} method resolves after the {@link Deposit} instance has been initialized
and stored into database. In the resolved object, `depositPromise` is returned for letting the caller wait
the confirmation of deposit transaction. If there is any error raised during the process,
{@link Deposit#errorMessage} will be set and {@link Deposit#status} will be changed to `FAILED`.

**Note:** if the given `shieldedAddress` is the user's own address, a {@link PrivateNote} will be automatically
created after the deposit is successfully confirmed on the source chain.

## Get the history of deposits
You could get the full history of all previously created deposits by calling this method:

```javascript
mystiko.deposits.getDeposits()
```

This method also supports filtering, sorting and pagination:

```javascript
// filtering
mystiko.deposits.getDeposits({ filterFunc: (d) => d.srcChainId === 3 })
// sorting
mystiko.deposits.getDeposits({ sortBy: 'bridge', desc: true })
// pagination
mystiko.deposits.getDeposits({ offset: 3 * 20, limit: 20 })
// all together
mystiko.deposits.getDeposits({
  filterFunc: (d) => d.srcChainId === 3,
  sortBy: 'bridge', desc: true,
  offset: 3 * 20, limit: 20,
})
```

Check {@link DepositHandler#getDeposits} for more information.

## Query a deposit
You could a deposit's information by id/transaction hash with this method:

```javascript
// query by id
mystiko.deposits.getDeposit(123)
// query by transaction hash
mystiko.deposits.getDeposit('0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a')
```

Check {@link DepositHandler#getDeposit} for more information.

## Export off-chain note
After a deposit is successfully confirmed. User might need to export the off-chain note from that deposit, if
the shielded address of that deposit does not belong to the user. You could call this method to export that note:

```javascript
// export by id
mystiko.deposits.exportOffChainNote(123)
// export by transaction hash
mystiko.deposits.exportOffChainNote('0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a')
// export by deposit object
mystiko.deposits.exportOffChainNote(deposit)
```

This method returns a {@link OffChainNote} object, you could call {@link OffChainNote#toString} method to convert
it to a JSON string.

Now you have finished this tutorial for creating a deposit. In the next tutorial,
you will learn {@tutorial tutorial06}.
