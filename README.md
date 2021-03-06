# auto-import.js

A tool for automatically update and import NPM module

<p align="center">
  <a href="https://www.npmjs.com/package/@ffee/auto-import"><img src="https://badge.fury.io/js/@ffee%2Fauto-import.svg" alt="npm version" height="18"></a>
  <a href="https://app.circleci.com/pipelines/github/ffee-team/auto-import?branch=main"><img src="https://img.shields.io/circleci/build/github/ffee-team/auto-import/main.svg?sanitize=true" alt="Build Status"></a>
  <a href="https://app.circleci.com/pipelines/github/ffee-team/auto-import/39/workflows/ba4683c3-2ed3-4b25-8d99-5af6c5685d02/jobs/40/parallel-runs/0/steps/0-106"><img src="https://img.shields.io/badge/Coverage-100%25-green" alt="Code Coverage" height="18"></a>
</p>

## Usage

### Install

```bash
npm i @ffee/auto-import --save
```

### AutoImport.require

Require the node module. If the module is not installed, install it automatically before loading it.

```js
const AutoImport = require('@ffee/auto-import');

AutoImport.require('koa').then(koa => {
  const app = new koa();
  app.use(async ctx => {
    ctx.body = 'Hello World!';
  });

  app.listen(3000);
});
```

### AutoImport.checkModuleUpdateStatus

Check whether the NPM module needs to be updated.

```js
const AutoImport = require('@ffee/auto-import');

AutoImport.checkModuleUpdateStatus('koa').then(res => {
  console.log(res);
  // {
  //   name: 'koa',
  //   status: false,
  //   message: 'koa had not expired, return current...'
  // }
});
```

## LICENSE

MIT.