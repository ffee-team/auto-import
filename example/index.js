const AutoImport = require('../lib');

AutoImport.checkModuleUpdateStatus('koa').then(res => {
  console.log(res);
});

// AutoImport.require('koa').then((mod) => {
//   console.log(mod);

//   const app = new mod();
//   app.use(async ctx => {
//     ctx.body = 'Hello World!';
//   });

//   app.listen(3000);
// });