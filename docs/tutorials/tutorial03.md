## Prerequisites
Before you go through this tutorial, please make sure you have finished {@tutorial tutorial02}.

## Create a new account
Once your wallet is created successfully, you could then add an account into the wallet, by calling this method:

```javascript
mystiko.accounts.addAccount('wallet password', 'name of account') // returns Promise<Account>
```

This method is `async`, you should await it properly to get the instance of the created {@link Account}.
Check {@link AccountHandler#addAccount} for more information about this method.

## List created accounts
After you added multiple accounts into the wallet, you could list all existing account in the same wallet, by using
this method:

```javascript
mystiko.accounts.getAccounts()
```

Check {@link AccountHandler#getAccounts} for more information.

## Query one account
If you want to get a specific account based on id/shielded address, you could use this method:

```javascript
// query by id
mystiko.accounts.getAccount(1)
// query by shielded address
mystiko.accounts.getAccount('Aa9ABUws2WBSUd3WVWCkUAA13SFnyDdbPVazY2YpRUvLZuLfSAh3rtDHqXVRxWPw8pRGsPc2sQuY31J66he6a3sao')
```

Check {@link AccountHandler#getAccount} for more information.

## Export account secret key
You can export the account full secret key by calling this method:

```javascript
// export by id
mystiko.accounts.exportAccountSecretKey('wallet password', 123)
// export by shielded address
mystiko.accounts.exportAccountSecretKey('wallet password', 'Aa9ABUws2WBSUd3WVWCkUAA13SFnyDdbPVazY2YpRUvLZuLfSAh3rtDHqXVRxWPw8pRGsPc2sQuY31J66he6a3sao')
// export by Account instance
mystiko.accounts.exportAccountSecretKey('wallet password', account)
```

Check {@link AccountHandler#exportAccountSecretKey} for more information.

## Import account from secret key
Sometimes user will offer secret key for importing an account into wallet. This can be done by calling this method:

```javascript
mystiko.accounts.importAccountFromSecretKey('wallet password', 'account name', 'secret key.....')
```

This method is `async`, please await it properly before it resolves.
Check {@link AccountHandler#importAccountFromSecretKey} for more information.

## Others
You could update account name by calling this method:

```javascript
// update by id
mystiko.accounts.updateAccountName('wallet password', 123, 'new name')
// update by shielded address
mystiko.accounts.updateAccountName('wallet password', 'Aa9ABUws2WBSUd3WVWCkUAA13SFnyDdbPVazY2YpRUvLZuLfSAh3rtDHqXVRxWPw8pRGsPc2sQuY31J66he6a3sao', 'new name')
// update by account instance
mystiko.accounts.updateAccountName('wallet password', account, 'new name')
```

Check {@link AccountHandler#updateAccountName} for more information.

You could remove an account by calling this method:

```javascript
// remove by id
mystiko.accounts.removeAccount('wallet password', 123)
// remove by shielded address
mystiko.accounts.removeAccount('wallet password', 'Aa9ABUws2WBSUd3WVWCkUAA13SFnyDdbPVazY2YpRUvLZuLfSAh3rtDHqXVRxWPw8pRGsPc2sQuY31J66he6a3sao', 'new name')
// remove by account instance
mystiko.accounts.removeAccount('wallet password', account)
```

Check {@link AccountHandler#removeAccount} for more information.

Now you have finished this tutorial for adding an {@link Account}. In the next tutorial,
you will learn {@tutorial tutorial04}
