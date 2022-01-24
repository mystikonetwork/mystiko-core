## Prerequisites
Before you go through this tutorial, please make sure you have finished {@tutorial tutorial06}.

## Create a withdrawal transaction
After you import {@link PrivateNote} into your wallet, you could choose any {@link PrivateNote} to withdraw the asset.
You can achieve that by calling this method.

Construct the request body.
```javascript
// 123 is the id of private note
var request = { privateNote: 123, recipientAddress: '0x44c2900FF76488a7C615Aab5a9Ef4ac61c241065' }
```

Choose a signer
```javascript
// signer should be connected - use this in browser
var signer = mystiko.signers.metaMask;
```
```javascript
// signer should be provided with private key - use this in Node.js console
var signer = mystiko.signers.privateKey;
```

Define callback function for listening on the status change
```javascript
var statusCallback = (withdraw, oldStatus, newStatus) => {
  console.log(`withdraw status changes from ${oldStatus} to ${newStatus}`)
}
```

Create the withdrawal transaction.
```javascript
mystiko.withdraws.createWithdraw('wallet password', request, signer, statusCallback)
  .then(({ withdraw, withdrawPromise })  => {
    return withdrawPromise.then(() => {
      if (withdraw.status == mystiko.models.WithdrawStatus.SUCCEEDED) {
        console.log(`Withdraw ${withdraw.id} succeeded`)
      } else {
        console.log(`Withdraw ${withdraw.id} failed with error ${withdraw.errorMessage}`)
      }
    });
  })
```

The {@link WithdrawHandler#createWithdraw} method resolves after the {@link Withdraw} instance has been initialized
and stored into database. In the resolved object, `withdrawPromise` is returned for letting the caller wait
the confirmation of withdrawal transaction. If there is any error raised during the process,
{@link Withdraw#errorMessage} will be set and {@link Withdraw#status} will be changed to `FAILED`.

## Get the history of withdrawal transactions
You could get the full history of all previously created withdrawal transactions by calling this method:

```javascript
mystiko.withdraws.getWithdraws()
```

This method also supports filtering, sorting and pagination:

```javascript
// filtering
mystiko.withdraws.getWithdraws({ filterFunc: (w) => w.chainId === 3 })
// sorting
mystiko.withdraws.getWithdraws({ sortBy: 'recipientAddress', desc: true })
// pagination
mystiko.withdraws.getWithdraws({ offset: 3 * 20, limit: 20 })
// all together
mystiko.withdraws.getWithdraws({
  filterFunc: (w) => w.chainId === 3,
  sortBy: 'recipientAddress', desc: true,
  offset: 3 * 20, limit: 20,
})
```

Check {@link WithdrawHandler#getWithdraws} for more information.

## Query a withdrawal transaction
You could a withdrawal information by id/transaction hash with this method:

```javascript
// query by id
mystiko.withdraws.getWithdraw(123)
// query by transaction hash
mystiko.withdraws.getWithdraw('0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a')
```

Congratulations! You have finished all the tutorials. If you want to know more about this library, please
go to the generated jsdoc {@link module:mystiko} for more detailed documentation.
