### Home

This [Smartdown](https://smartdown.io) document shows how [Filament](https://github.com/joshmarinacci/filament-lang) may be utilized within a Smartdown environment, and provides some examples.

The examples are derived from the [/test](https://github.com/joshmarinacci/filament-lang/tree/master/test) examples in the Filament repository.

Click the `Play` button at the top of each playable to execute Javascript code that will in turn execute the Filament code.


#### 42ft

Evaluate the Filament expression `42ft`.

```javascript /playable
//smartdown.import=../dist/filament.js

//read the source grammar first
const resp = await fetch('../dist/filament.ohm');
const grammarSource = await resp.text();
await Filament.setup_parser(grammarSource)

let ret = await Filament.eval_code('42ft')
this.log('we should have a scalar with 42 and feet for the unit:' + ret);

```


#### Draw a Heart on a Chart

The following playable will evaluate the Filament expression:

```filament
{
  def px3(t:?) { (16 * (sin(t)**3))/10 }
  def py3(t:?) { (13 * cos(t) - 5 * cos (2*t) - 2 * cos(3*t) - cos(4*t))/10 }
  plot(x:px3, y:py3)
}
```

```javascript /playable
//smartdown.import=../dist/filament.js

const canvasId = this.div.id + '_canvas';
this.div.innerHTML =
`
<canvas
  id="${canvasId}"
  style="display: block; margin: auto; border: 5px solid blue;"
  width="500"
  height="500"></canvas>
`;

const canvas = document.getElementById(canvasId);

const resp = await fetch('../dist/filament.ohm');
const grammarSource = await resp.text();
await Filament.setup_parser(grammarSource)

const heartCode =
`
{
  def px3(t:?) { (16 * (sin(t)**3))/10 }
  def py3(t:?) { (13 * cos(t) - 5 * cos (2*t) - 2 * cos(3*t) - cos(4*t))/10 }
  plot(x:px3, y:py3)
}
`;

let ret = await Filament.eval_code(heartCode);
ret.cb(canvas);
this.log('---');
this.log(heartCode);
this.log('---');

```


