## Prerequisites
Before you go through this tutorial, please make sure you have finished {@tutorial tutorial05}.

## Import private note from off-chain note
If your user receives an off-chain note from others, he/she has to imported into wallet for later withdraw operations.
You could call this method to achieve that:

```javascript
// import from JSON string
mystiko.notes.importFromOffChainNote('wallet password', '{"chainId": 1, "transactionHash": "0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a"}')
// import from OffChainNote instance
mystiko.notes.importFromOffChainNote('wallet password', offChainNote)
```
This method is `async`, please await it properly before it resolves. The method will resolve to a {@link PrivateNote}
instance after it finishes gathering information.
Check {@link OffChainNote} and {@link NoteHandler#importFromOffChainNote} for more information.

## Get list of imported private notes
You could get all imported private notes by calling this method:

```javascript
mystiko.notes.getPrivateNotes()
```

If you want to get private notes by account, you could call it with `filterFunc` defined like this

```javascript
var shieldedAddress = 'Aa9ABUws2WBSUd3WVWCkUAA13SFnyDdbPVazY2YpRUvLZuLfSAh3rtDHqXVRxWPw8pRGsPc2sQuY31J66he6a3sao'
mystiko.notes.getPrivateNotes({ filterFunc: (note) => note.shieldedAddress === shieldedAddress })
```

Or you could get all private notes for one particular asset

```javascript
var notes = mystiko.notes.getPrivateNotes({ filterFunc: (note) => note.dstAsset === 'ETH' })
var totalAmount = notes.reduce((n1, n2) => n1.amount.add(n2.amount))
```

You could also do sorting and pagination:

```javascript
// sort by status
mystiko.notes.getPrivateNotes({ sortBy: 'status', desc: true })
// pagination
mystiko.notes.getPrivateNotes({ offset: 3 * 20, limit: 30 })
// all together
mystiko.notes.getPrivateNotes({
  filterFunc: (d) => d.srcChainId === 3,
  sortBy: 'bridge', desc: true,
  offset: 3 * 20, limit: 20,
})
```

Check {@link PrivateNote#getPrivateNotes} for more information.

## Query a private note
You could a private note's information by id/transaction hash with this method:

```javascript
// query by id
mystiko.notes.getPrivateNote(123)
// query by transaction hash
mystiko.notes.getPrivateNote('0xdb8433b7b5f3f96e2f17d5fccd1c433b356bc210e3637447d5a284f5f06f6b3a')
```

Now you have finished this tutorial for importing a private note. In the next tutorial,
you will learn {@tutorial tutorial07}.
