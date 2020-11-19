export const isArray = Array.isArray;
export const isString = (val: any) => typeof val === 'string';
export const isSymbol = (val: any) => typeof val === 'symbol';
export const isFunction = (val: any) => typeof val === 'function';
export const isObject = (val: any) => val !== null && typeof val === 'object';
export const isPromise = (val: any) => isObject(val) && isFunction(val.then) && isFunction(val.catch);

const ObjectToString = Object.prototype.toString;
export const toTypeString = (value: any) => ObjectToString.call(value);
export const toRawString = (value: any) => toTypeString(value).slice(8, -1);

export const isPlainObject = (val: any) => toTypeString(val) === '[object Object]';
