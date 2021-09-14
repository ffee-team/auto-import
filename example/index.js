const { AutoImport } = require('../lib');

AutoImport.require('ora').then((mod) => {
  console.log(mod);
});