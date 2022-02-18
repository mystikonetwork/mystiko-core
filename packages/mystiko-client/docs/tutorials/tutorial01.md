## Overview
This is the first tutorial for how to use the [Javascript library](/src) of Mystiko. You can run the series of
these tutorials both in browser environment or Node.js console.

## Run in browser
### Build the bundle
We have to build the UMD format javascript bundle to let it runs smoothly in browser. You could run this command to the
javascript bundle:

```bash
cd packages/mystiko-client-browser
yarn build
```

The output file is located in `build/mystiko.*.js`.

### Use the bundle
You could use the bundled javascript library by adding it into the `<script>` tag in your `index.html`. For example:

```html
<!doctype html>
<html>
  <head>
    <title>Mystiko Is Awesome</title>
    <script type='text/javascript' src='./mystiko.474e6f967ef70ff8c557.js'></script>
  </head>
  <body>
    <p>Hello Mystiko</p>
  </body>
</html>
```

### Initialize the library
After imported the bundled javascript library in browser,
you can get a {@link module:mystiko} variable to let you visit all
exported methods/classes/constants from single source. However, before you could use it, you need to initialize the
library by calling this function:

```javascript
mystiko.initialize() // returns Promise<void>
```

This function is `async` and it returns `Promise<void>`, therefore, you need to properly wait for it resolves correctly.
Please check the {@link module:mystiko.initialize} for more information of this method.

## Run in Node.js console
### Build the project
Before you run, there are some resources need to be built. Run this command:

```bash
cd packages/mystiko-client-node
yarn build
```

### Start node console
You need to first build the package before running it in node console.

```bash
cd packages/mystiko-client-node
yarn build
node
```

**Tips** If you want to input multiple lines of code, you could just enter `.editor` in the node console:

```bash
babel > .editor
// Entering editor mode (Ctrl+D to finish, Ctrl+C to cancel)
```
Then use `ctrl-D` to exit the editor mode.

### Import the library
After your successfully build the package, you could import the library like this:

```javascript
var mystiko = require('./build/mystiko.cjs').default
```

### Initialize the library
You need to initialize the library before you do other things, you can achieve it by calling this function:

```javascript
mystiko.initialize()
```

Now you have finished the first tutorial. In the next tutorial, you will learn
{@tutorial tutorial02} with this library.
