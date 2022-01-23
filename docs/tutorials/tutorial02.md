## Prerequisites
Before you go through this tutorial, please make sure you have finished {@tutorial tutorial01}.

## Check existence of previously created wallet
There should be only **ONE** wallet instance during entire lifecycle of this library. Therefore, before you start creating
the wallet, you need to first check whether there is existing one with this method:

```javascript
mystiko.wallets.getCurrentWallet()
```

This method will return the {@link Wallet} instance if it exists, otherwise it returns `undefined`. We should expect `undefined`
here, because we just started our tutorial. However, in real world scenario, you should always check before you create
a new one. Otherwise, the newly created one will replace the old one, all existing transaction history and accounts will
be ignored. Please check {@link WalletHandler#getCurrentWallet} for more information about this method.

## Create a new instance
If above check indeed returns `undefined`. Then you should create a new `Wallet` instance, by using this method:

```javascript
mystiko.wallets.createWallet('some master seed', 'wallet password') // returns Promise<Wallet>
```
The master seed is normally generated from mnemonic words. In Javascript, you could use the [bip39](https://github.com/bitcoinjs/bip39)
library to generate master seed from mnemonic words. The above function is `async`, please await it properly to get the
created {@link Wallet} instance. Please check {@link WalletHandler#createWallet} for more information about this method.

## Login the wallet
After user session ends in the browser, you should ask the user re-login the wallet. Login the wallet could be implemented
by checking the password that the user offers. The method is used like this way.

```javascript
mystiko.wallets.checkPassword('an input password') // returns true/false
```

If the input password is incorrect, this method will return `false`.
Please check {@link WalletHandler#checkPassword} for more information about this method.

## Change wallet's password
Changing wallet's password requires two steps:
* re-encryption of all password encrypted sensitive information
* update the wallet's hashed password in database.

Therefore, you should call these two methods to make it work correctly:

```javascript
mystiko.accounts.updateAccountKeys('old password', 'new password').then(() => {
  return mystiko.wallets.updatePassword('old password', 'new password')
})
```

If the input old password is incorrect, the above method will be rejected.
Please check {@link AccountHandler#updateAccountKeys} and {@link WalletHandler#updatePassword}
for more information about these two methods.

## Export master seed
Export the master seed to let user recover their mnemonic words. You could call this function:

```javascript
mystiko.wallets.exportMasterSeed('wallet password')
```

This method will raise error if the given wallet password is incorrect.
Please check {@link WalletHandler#exportMasterSeed} for more information about this method.

Now you have finished this tutorial for creating a new {@link Wallet} instance. The next tutorial you will learn
{@tutorial tutorial03}.
