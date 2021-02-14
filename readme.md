This is the parser and runtime library implementing the Filament language.


Install with 

```shell
npm install --save filament-lang
```

Evaluate code:

```javascript
//read the source grammar first
let grammar_source = (await fs.readFile('node_modules/filament-lang/src/filament.ohm')).toString();
await setup_parser(grammar_source)
let ret = await eval_code('42ft')
console.log("we should have a scalar with 42 and feet for the unit:",ret)
```

produces a scalar object with the value of 42 feet

```javascript
(ret.value === 42)
(ret.unit  === 'foot')
(ret.dim   === 1)

//as a string
console.log(ret.toString())
```

Filament has a bunch of built-in functions for math, lists, and data access. You can add your own functions
by customizing the scope and passing it into `eval_code`.

```javascript

let double = new FilamentFunction('double',
    {value:REQUIRED},
    (a) =>scalar(a.value*2,a.unit,a.dim)
)

let scope = make_standard_scope()
scope.install(double)

console.log("4 doubled is", await eval_code('double(42,ft)',scope))
```

Read the tutorial.


### Building a browser-compatible UMD module

The Filament source code may be bundled into an application via tools such as Webpack, using an `import` or `require` statement. This mechanism should work in both the browser and NodeJS environments.

In addition, it is possible to create a UMD module suitable for use in a browser-side HTML page. This module may be included via a `<script>` tag, or (untested at this time) may be used in a NodeJS environment.

To create the UMD module, use the following:

```
npm run build-umd
```

This will create a `dist/` directory and the following files in that directory:

- `dist/filament.js`
- `dist/filament.ohm`


#### Testing the built UMD module

An HTTP server is necessary to serve the contents of this repository. There are many to choose from, but for the purposes of this document, we will use [http-server](https://github.com/http-party/http-server#readme), which is installed as a development dependency via `package.json`.

After building the UMD module via `npm run build-umd`, the following command will serve up the content of the `test-umd/` directory:

```
npm run test-umd
```

You can then point your web browser at `http://127.0.0.1:8080` to see `test/index.html`.


##### (Optionally) Test Smartdown

This fork of the original Filament repo also contains a demonstration of Smartdown exercising Filament. Once you've run `npm run test-umd`, you can point your web browser at `http://127.0.0.1:8080/smartdown` to see `test/smartdown/index.html`, which will render `test/smartdown/Home.md` via Smartdown.


