import {FilamentFunction, REQUIRED} from './parser.js'
import {date, is_boolean, is_list, is_scalar, list, pack, scalar, time, unpack} from './ast.js'
import {convert_unit, find_conversion, to_canonical_unit} from './units.js'
import {parse as parse_date, getYear, getMonth, getDate, toDate, getHours, getMinutes, getSeconds, differenceInDays, differenceInSeconds} from "date-fns"

function binop(a,b,cb) {
    // console.log("binop-ing",a,b)
    if(is_scalar(a) && is_scalar(b)) return pack(cb(unpack(a),unpack(b)))
    if(is_boolean(a) && is_boolean(b)) return pack(cb(unpack(a),unpack(b)))
    if(is_list(a) && is_list(b)) {
        return list(a.value.map((aa,i)=> pack(cb(unpack(a.value[i]),unpack(b.value[i])))))
    }
    if(is_list(a) && is_scalar(b)) {
        return list(a.value.map((_,i)=> pack(cb(unpack(a.value[i]),unpack(b)))))
    }
    if(is_scalar(a) && is_list(b)) {
        return list(b.value.map((_,i)=> pack(cb(unpack(a),unpack(b.value[i])))))
    }
    console.log("erroring",a,b,cb)
    throw new Error("can't binop " + a.toString() + " " + b.toString())
}

function unop(a,cb) {
    if(Array.isArray(a)) return a.map(v => cb(v))
    return pack(cb(unpack(a)))
}

export const add = new FilamentFunction('add',{a:REQUIRED, b:REQUIRED},
    function(a,b) {
    if(is_scalar_with_unit(a) && is_scalar_without_unit(b)) throw new Error(`cannot add incompatible units ${a.toString()} and ${b.toString()}`)
    if(is_scalar_with_unit(a) && is_scalar_with_unit(b)) {
        let conv = find_conversion(a,b)
        // console.log('final conversion is',conv)
        if(conv) return scalar(a.value/conv.ratio + b.value, conv.to)
    }

    return binop(a,b, (a,b)=>a+b)
})
export const subtract = new FilamentFunction('subtract',{a:REQUIRED, b:REQUIRED},
    function (a,b) {
        if(is_scalar_with_unit(a) && is_scalar_without_unit(b)) throw new Error(`cannot subtract incompatible units ${a.toString()} and ${b.toString()}`)
        if(is_scalar_with_unit(a) && is_scalar_with_unit(b)) {
            let conv = find_conversion(a,b)
            if(conv) return scalar(a.value/conv.ratio - b.value, conv.to)
        }
        if(is_date(a) && is_date(b)) {
            console.log("subtracting scalar with unit",a,b)
            let days = differenceInDays(a.value,b.value)
            return scalar(days,'days',1)
        }
        if(is_time(a) && is_time(b)) {
            console.log("subtracting scalar with unit",a,b)
            let seconds = differenceInSeconds(a.value,b.value)
            return scalar(seconds,'seconds',1)
        }

    return binop(a,b,(a,b)=>a-b)
})

function is_scalar_with_unit(a) {
    if(a.unit === 'none') return false
    if(is_scalar(a) && a.unit !== null) return true
    return false
}

function is_date(a) {
    return a.type === 'date'
}
function is_time(a) {
    return a.type === 'time'
}


function is_scalar_without_unit(a) {
    if(is_scalar(a) && (a.unit === null || a.unit === 'none') ) return true
    return false
}

export const multiply = new FilamentFunction('multiply',{a:REQUIRED, b:REQUIRED},
    function (a,b) {
        //if one has a unit and one does
        if(is_scalar_with_unit(a) && is_scalar_without_unit(b)) {
            return scalar(a.value*b.value,a.unit)
        }
        if(is_scalar_with_unit(b) && is_scalar_without_unit(a)) {
            return scalar(b.value*a.value,b.unit)
        }
        if(is_scalar_with_unit(a) && is_scalar_with_unit(b)) {
            let conv = find_conversion(a,b)
            if(conv) return scalar(a.value/conv.ratio*b.value,conv.to,a.dim+b.dim)
        }
    return binop(a,b,(a,b)=>a*b)
})
export const divide = new FilamentFunction('divide',{a:REQUIRED, b:REQUIRED},
    function (a,b) {
        if(is_scalar_with_unit(a) && is_scalar_without_unit(b)) {
            return scalar(a.value/b.value,a.unit)
        }
        if(is_scalar_with_unit(b) && is_scalar_without_unit(a)) {
            return scalar(b.value/a.value,b.unit)
        }
        if(is_scalar_with_unit(a) && is_scalar_with_unit(b)) {
            let conv = find_conversion(a,b)
            if(conv) return scalar(a.value/conv.ratio/b.value,conv.to,a.dim-b.dim)
        }
    return binop(a,b,(a,b)=>a/b)
})
export const power = new FilamentFunction('power',{a:REQUIRED, b:REQUIRED},
    function (a,b) {
        if(is_scalar_with_unit(a) && is_scalar_without_unit(b)) {
            return scalar(Math.pow(a.value,b.value),a.unit)
        }
    return binop(a,b,(a,b)=>Math.pow(a,b))
})
export const negate = new FilamentFunction('negate', {a:REQUIRED}, (a) =>unop(a,a=>-a))
export const factorial = new FilamentFunction('factorial', {a:REQUIRED}, (a) => unop(a,(a)=>{
    if(a === 0 || a === 1) return 1
    let sum = 1
    for(let i=1; i<=a; i++) sum *= i
    return sum
}))

function make_binop(name, cb) {
    return new FilamentFunction(name,{a:REQUIRED, b:REQUIRED}, (a,b) => binop(a,b,cb))
}

function make_unop(name, cb) {
    return new FilamentFunction(name,{a:REQUIRED}, (a) => unop(a,cb))
}

export const sin = new FilamentFunction('sin', {a:REQUIRED}, (a) =>scalar(Math.sin(a.value)))
export const cos = new FilamentFunction('cos', {a:REQUIRED}, (a) =>scalar(Math.cos(a.value)))
export const tan = new FilamentFunction('tan', {a:REQUIRED}, (a) =>scalar(Math.tan(a.value)))
export const abs = new FilamentFunction('abs', {a:REQUIRED}, (a) =>scalar(Math.abs(a.value)))

export const mod = make_binop('mod',(a,b)=>a%b)
export const lessthan = make_binop('lessthan',(a,b)=>a<b)
export const greaterthan = make_binop('greaterthan',(a,b)=>a>b)
export const equal = make_binop('equal',(a,b)=>a===b)
export const notequal = make_binop('notequal',(a,b)=>a!==b)
export const lessthanorequal = make_binop('lessthanorequal',(a,b)=>a<=b)
export const greaterthanorequal = make_binop('greaterthanorequal',(a,b)=>a>=b)
export const and = make_binop('and',(a,b)=>a&&b)
export const or = make_binop('or',(a,b)=>a||b)
export const not = make_unop('not',a => !a)


export const convertunit = new FilamentFunction('convertunit',
    {a:REQUIRED,b:REQUIRED},
    (a,b) => {
        return scalar(
            convert_unit(a.value,a.unit,to_canonical_unit(b)),
            to_canonical_unit(b))
    })


export const is_prime = new FilamentFunction('is_prime', {n:REQUIRED},function(n) {
    let num = unpack(n)
    for(let i = 2; i < num; i++)
        if(num % i === 0) return pack(false);
    return pack(num > 1);
})

export const date_cons = new FilamentFunction('date',{
    input:null,
    year:scalar(0),
    month:scalar(0),
    day:scalar(0),
    format:null,
},function(input,year,month,day,format){
    console.log("making a date from",input,year,month,day)
    if(input && format) {
        let dt = parse_date(input,format,new Date())
        return date(getYear(dt),getMonth(dt)+1,getDate(dt))
    }
    // if(input && !format) {
    //     let dt = toDate(input)
    //     return date(getYear(dt),getMonth(dt)+1,getDate(dt))
    // }
    if(year.value > 0 && month.value > 0 && day.value > 0) {
        return date(unpack(year), unpack(month), unpack(day))
    }

    throw new Error(`cannot create date from args ${input} , ${year}, ${month},${day},${format}`)
})

export const time_cons = new FilamentFunction('time',{
    input:null,
    hour:scalar(0),
    minute:scalar(0),
    second:scalar(0),
    format:null,
},function(input,hour,minute,second,format){
    console.log("making a time from",input,hour,minute,second,format)
    if(input && format) {
        let dt = parse_date(input,format,new Date())
        console.log("parsed date",dt)
        return time(getHours(dt), getMinutes(dt), getSeconds(dt))
    }
    // if(input && !format) {
    //     let dt = toDate(input)
    //     return date(getYear(dt),getMonth(dt)+1,getDate(dt))
    // }
    // if(hour.value > 0 && minput.value > 0 && second.value > 0) {
    //     return date(unpack(hour), unpack(minute), unpack(second))
    // }

    throw new Error(`cannot create date from args ${input} , ${hour}, ${minute},${second},${format}`)
})