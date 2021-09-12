const { AutoImport } = require('../lib');

AutoImport.require('koa').then((mod) => {
  console.log(mod);
});