/**
 * ***w**hat* *in the actual fuck is the* actual ***t**ype* *o**f*** *this here* `thing` *???*
 *
 * @example
 * ```ts
 * wtf('dafuq') // -> 'string'
 * wtf(-69) // -> 'number'
 * wtf(420.69) // -> 'number'
 * wtf(NaN) // -> 'NaN'
 * wtf(true) // -> 'boolean'
 * wtf(['is', 'going', 'on']) // -> 'array'
 * wtf({ foo: 'bar' }) // -> 'object'
 * wtf(undefined) // -> 'undefined'
 * wtf(null) // -> 'null'
 * wtf(Symbol('uwu')) // -> 'symbol'
 * wtf(new Date()) // -> 'Date'
 * wtf(/(fo{2}|ba[rz])/i) // -> 'RegExp'
 * wtf(() => 'foo') // -> 'Function'
 * wtf(new Error('foo')) // -> 'Error'
 * wtf(arrBuf) // -> 'Uint8Array'
 * wtf(doc.data) // -> 'Binary'
 * wtf() // -> 'undefined'
 * ```
 * @since 1.2.5
 */
export const wtf = (
  thing: unknown,
): string => (
  (thing === null && 'null')
    || (Number.isNaN(thing) && 'NaN')
    || (Array.isArray(thing) && 'array')
    || (typeof thing === 'object' && thing?.constructor?.name)
    || typeof thing
);
