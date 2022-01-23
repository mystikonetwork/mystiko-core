## Prerequisites
Before you go through this tutorial, please make sure you have finished {@tutorial tutorial03}.

## Check whether MetaMask is installed
Before we connect to [Metamask](https://metamask.io), you should always check whether MetaMask is installed
in user's browser. You could call this method to check it.

```javascript
mystiko.signers.metaMask.installed() // returns Promise<boolean>
```

The method is `async`, you should properly await for it before it resolves.
If MetaMask is not installed, you should ask the user install it before proceeding to the deposit/withdraw process.
Check {@link MetaMaskSigner#installed} for more information.

## Check whether MetaMask is connected
You could check whether your application is connected MetaMask by calling this method:

```javascript
mystiko.signers.metaMask.connected() // returns Promise<boolean>
```

The method is `async`, you should properly await for it before it resolves.
Check {@link MetaMaskSigner#connected} for more information.

## Connect MetaMask
If MetaMask is not connected, then you could connect it by calling this method:

```javascript
mystiko.signers.metaMask.connect() // returns Promise<string[]>
```

The method is `async`, you should properly await for it before it resolves.
If the connection succeeds, the promise will resolve to a **non-empty** array of connected accounts.
You should use the first element of the array as the current connected address.
Check {@link MetaMaskSigner#connect} for more information.

## Get connected account address
After MetaMask is being successfully connected, you could call this method to get the connected account addresses:

```javascript
mystiko.signers.metaMask.accounts().then((accounts) => {
    console.log(`current connected address ${accounts[0]}`)
})
```

The method is `async`, you should properly await for it before it resolves.
The current effective account is the first element of the returned array.
Check {@link MetaMaskSigner#accounts} for more information.

Now you have finished this tutorial for connecting to MetaMask. In the next tutorial,
you will learn {@tutorial tutorial05}.
