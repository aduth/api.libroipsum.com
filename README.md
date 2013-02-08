# api.libroipsum.com

Source for LibroIpsum public API. Supports `.txt`, `.json`, `.jsonp`, and `.xml` content-type rendering.

[Read more about LibroIpsum](http://github.com/aduth/LibroIpsum)

Example API requests: [Cicero](http://api.libroipsum.com/books/cicero.json?words=80&paragraphs=2), [Plato's Republic](http://api.libroipsum.com/books/republic.json), [Obama-Romney Debates (2012)](http://api.libroipsum.com/politics/obamaromneydebate.xml), [Huckleberry Finn](http://api.libroipsum.com/books/huckleberryfinn.txt)

~~[LibroIpsum.com](http://www.libroipsum.com)~~ (Not yet available)

## Installation

To use the source locally, you must first have Node.js installed ([installer](http://nodejs.org/download/)). Then, in your terminal, clone the repository and install dependencies:

```bash
git clone git://github.com/aduth/api.libroipsum.com.git
cd api.libroipsum.com
npm install
```

Start the server with Node.js:

```bash
node index.js
```

To make use of the API, there must be source texts available in the `sources/` directory. These sources are automatically loaded and seeded (cached) by the server. For example, if `sources/books/example.txt` exists, generated LibroIpsum text can be accessed at `http://localhost:8080/books/example.json`.

To make changes, modify `.coffee` source files in the `src/` directory. A Gruntfile exists to easily watch and compile CoffeeScript to JavaScript:

```bash
npm install -g grunt-cli # If not already installed
grunt
```

## License

Copyright (c) 2013 Andrew Duthie

Released under the MIT License (see LICENSE.txt)
