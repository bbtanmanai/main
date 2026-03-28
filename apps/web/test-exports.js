const commonmark = require('@milkdown/preset-commonmark');
console.log('commonmark keys:', Object.keys(commonmark));
const gfm = require('@milkdown/preset-gfm');
console.log('gfm keys:', Object.keys(gfm));
const history = require('@milkdown/plugin-history');
console.log('history keys:', Object.keys(history));
const core = require('@milkdown/core');
console.log('core keys:', Object.keys(core));
