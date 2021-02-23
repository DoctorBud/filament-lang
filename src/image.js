import {FilamentFunctionWithScope, REQUIRED} from './parser.js'
import {list, scalar} from './ast.js'
import {default as PImage} from 'pureimage'
import {default as fetch} from "node-fetch"


export const make_image = new FilamentFunctionWithScope('makeimage',
    {
        width: scalar(64),
        height: scalar(64)
    },
    function (scope, width, height) {
        return PImage.make(width.value, height.value)
    }
)

export const map_image = new FilamentFunctionWithScope('mapimage',
    {
        "image": REQUIRED,
        "with": REQUIRED
    },
    async function (scope, image, _with) {
        for (let x = 0; x < image.width; x++) {
            for (let y = 0; y < image.height; y++) {
                if (_with.type === 'lambda') {
                    let sx = scalar(x)
                    let sy = scalar(y)
                    let px = image.getPixelRGBA_separate(x, y)
                    let color = list([scalar(px[0]), scalar(px[1]), scalar(px[2])])
                    let ret = await _with.apply_function(scope, _with, [sx, sy, color])
                    let vals = ret.value.map(s => s.value)
                    image.setPixelRGBA_i(x, y, vals[0] * 255,
                        vals[1] * 255,
                        vals[2] * 255,
                        255)
                } else {
                    // return cb.fun.apply(cb, [el])
                }
            }
        }
        return image
    }
)

export const load_image = new FilamentFunctionWithScope('loadimage',
    {
        "src": REQUIRED
    },
    async function (scope, src) {
        let url = src.value
        return await fetch(url)
            .then(r => {
                if(url.toLowerCase().endsWith(".jpg")) {
                    return PImage.decodeJPEGFromStream(r.body)
                } else {
                    return PImage.decodePNGFromStream(r.body)
                }
            })
    }
)
