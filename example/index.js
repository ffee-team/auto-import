const AutoImport = require('../lib');

AutoImport.checkModuleUpdateStatus('koa').then(res => {
  console.log(res);
  // {
  //   name: 'koa',
  //   status: false,
  //   message: 'koa had not expired, return current...'
  // }
});

AutoImport.require('koa').then((mod) => {
  const app = new mod();
  app.use(async ctx => {
    ctx.body = 'Hello World!';
  });

  const server = app.listen(3000, () => {
    server.close();
  });
});