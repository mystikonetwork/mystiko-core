## Overview
This is the first tutorial for how to use the [Javascript library](/src) of Mystiko. The series of these tutorials assumes
the running environment is **browser**. Running in the Node.js environment should be fairly straight-forward.

## Build the bundle
We have to build the UMD format javascript bundle to let it runs smoothly in browser. You could run this command to the
javascript bundle:

```bash
yarn build:js
```

The output file is located in [build/js/mystiko.js](/build/js/mystiko.js).

## Use the bundle
You could use the bundled javascript library by adding it into the `<script>` tag in your `index.html`. For example:

```html
<!doctype html>
<html>
  <head>
    <title>Mystiko Is Awesome</title>
    <script type='text/javascript' src='./mystiko.js'></script>
  </head>
  <body>
    <p>Hello Mystiko</p>
  </body>
</html>
```

## Initialize the library
After imported the bundled javascript library, it inserts a global variable {@link module:mystiko} to let you visit all
exported methods/classes/constants from single source. However, before you could use it, you need to initialize the
library by calling this function:

```javascript
mystiko.initialize() // returns Promise<void>
```

This function is `async` and it returns `Promise<void>`, therefore, you need to properly wait for it resolves correctly.
Please check the {@link module:mystiko.initialize} for more information of this method.

Now you have finished the first tutorial. In the next tutorial, you will learn
{@tutorial tutorial02} with this library.
