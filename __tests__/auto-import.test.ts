import path from "path";
import fs from "fs-extra";
import { execSync } from 'child_process';
import { Utils } from "../src/utils";
import { AutoImport } from "../src/auto-import";

describe("#auto-import tester", () => {
  beforeAll(() => {
    (Utils as any).DEFAULT_ROOT = __dirname;
    (Utils as any).logger = (...args: string[]) => {
      return args.join(" ");
    };
  });

  afterAll(() => {
    execSync('rm -rf ' + path.join(__dirname, 'node_modules'));
  });

  describe("#method: getNpmInfo", () => {
    test('getNpmInfo success:', async () => {
      const modName = "vue";
      const res1 = await AutoImport.getNpmInfo(modName);
      expect(res1.status).toBe(true);
      expect(res1.data.name).toBe(modName);

      const res2 = await AutoImport.getNpmInfo(modName, Utils.DEFAULT_REGISTRY);
      expect(res2.status).toBe(true);
      expect(res2.data.name).toBe(modName);
    }, 10000);

    test('getNpmInfo fail: get a not-exist-module', async () => {
      const modName = "not-exist-modules-a";
      const res = await AutoImport.getNpmInfo(modName);
      expect(res.status).toBe(false);
      expect(res.code).toBe(404);
      expect(res.error).toBe(null);
    }, 10000);

    test('getNpmInfo fail: get from error registry host', async () => {
      const modName = "not-exist-modules-b";
      const res = await AutoImport.getNpmInfo(modName, 'https://registry.npm.error-host.org');
      expect(res.status).toBe(false);
      expect(res.code).toBe(500);
      expect(res.error.code).toBe('ENOTFOUND');
    }, 10000);
  });

  describe("#method: setModuleExpireTime", () => {
    const modName = "react";
    const root = __dirname;
    const expire = 20000;

    test("setModuleExpireTime: false", async () => {
      const modPkgPath = Utils.setModulePkgPath(modName, root);
      expect(fs.existsSync(modPkgPath)).toBe(false);

      const res = AutoImport.setModuleExpireTime(modName, {
        root,
        expire
      });
      expect(res).toBe(false);
    });

    test("setModuleExpireTime: true", async () => {
      AutoImport.install(modName);
      const modPkgPath = Utils.setModulePkgPath(modName, root);
      expect(fs.existsSync(modPkgPath)).toBe(true);

      const res = AutoImport.setModuleExpireTime(modName, {
        root,
        expire
      });
      expect(res).toBe(true);

      const pkg = Utils.readJSONSync(modPkgPath);
      expect(pkg.name).toBe(modName);
      expect(pkg.__expire).toBe(Utils.DEFAULT_TIME_NOW + expire * 1000);


      AutoImport.setModuleExpireTime(modName);
      const pkg2 = Utils.readJSONSync(modPkgPath);
      expect(pkg2.__expire).toBe(Utils.DEFAULT_TIME_NOW + 3600 * 24 * 1000);
    });
  });

  describe("#method: install", () => {
    test("install a module success: install('express')", async () => {
      const modName = "express";
      AutoImport.install(modName, { stdio: 'ignore' });
      const modPath = Utils.setModulePath(modName);
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
    });

    test("install a module success: install('koa', __dirname)", async () => {
      const modName = "koa@1.7.0";
      const root = __dirname;
      const [name] = Utils.formatModuleName(modName);
      const modPath = Utils.setModulePath(name, root);
      expect(fs.existsSync(modPath + '/package.json')).toBe(false);
      AutoImport.install(modName, { root, expire: 0 });
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
    });
  });

  describe("#method: installAndRequire", () => {
    const root = __dirname;
    test("installAndRequire module: success", async () => {
      const modName = "redux";
      const modPath = Utils.setModulePath(modName);
      expect(fs.existsSync(modPath + '/package.json')).toBe(false);

      const mod = AutoImport.installAndRequire(modName);
      expect(typeof mod.createStore === "function").toBe(true);
    });
    test("installAndRequire module: fail", async () => {
      const modName = "a-fail-module-error";
      const mod = AutoImport.installAndRequire(modName, { root, stdio: 'ignore' });
      expect(mod).toBe(null);
    });
  });

  describe("#method: checkModuleUpdateStatus", () => {
    const root = __dirname;
    test("checkModuleUpdateStatus: not existed, install right now", async () => {
      const modName = "a-not-exist-module";
      const modPath = Utils.setModulePath(modName);
      expect(fs.existsSync(modPath + '/package.json')).toBe(false);
      const res = await AutoImport.checkModuleUpdateStatus(modName);

      expect(res.status).toBe(true);
      expect(res.message).toBe(`${modName} not existed, install right now...`);
    });

    test("checkModuleUpdateStatus: has existed a higher version, return currect now...", async () => {
      const modName = "react@15.6.2";
      const [name] = Utils.formatModuleName(modName);
      const modPath = Utils.setModulePath(name, root);

      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
      const res = await AutoImport.checkModuleUpdateStatus(modName, { root });

      expect(res.status).toBe(false);
      expect(res.message).toBe(`${modName} has existed a higher version, return currect now...`);
    });

    test("checkModuleUpdateStatus: has existed, but version is low, install right now...", async () => {
      const modName = "react@18.1.0";
      const [name] = Utils.formatModuleName(modName);
      const modPath = Utils.setModulePath(name, root);

      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
      const res = await AutoImport.checkModuleUpdateStatus(modName, { root });

      expect(res.status).toBe(true);
      expect(res.message).toBe(`${modName} has existed, but version is low, install right now...`);
    });

    test("checkModuleUpdateStatus: not expired, return current...", async () => {
      const modName = "react";
      const [name] = Utils.formatModuleName(modName);
      const modPath = Utils.setModulePath(name);

      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
      const res = await AutoImport.checkModuleUpdateStatus(modName);

      expect(res.status).toBe(false);
      expect(res.message).toBe(`${modName} not expired, return current...`);
    });

    test("checkModuleUpdateStatus: expired, install and require...", async () => {
      const modName = "koa";
      const modPath = Utils.setModulePath(modName);
      AutoImport.setModuleExpireTime(modName, { expire: -1000 });

      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
      const res = await AutoImport.checkModuleUpdateStatus(modName);
      console.log(res);

      expect(res.status).toBe(true);
      expect(res.message).toBe(`${modName} expired, install and require...`);
    });

    test("checkModuleUpdateStatus: expired, but version is latest, return current...", async () => {
      const modName = "express";
      const modPath = Utils.setModulePath(modName);
      AutoImport.setModuleExpireTime(modName, { expire: -1000 });

      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
      const res = await AutoImport.checkModuleUpdateStatus(modName);

      expect(res.status).toBe(false);
      expect(res.message).toBe(`${modName} expired, but version is latest, return current...`);
    });
  });

  describe("#method: require", () => {
    const root = __dirname;
    test("require un-exists module: success", async () => {
      const modName = "bl";
      const modPath = Utils.setModulePath(modName, root);
      expect(fs.existsSync(modPath + '/package.json')).toBe(false);

      const mod = await AutoImport.require(modName, { root });
      expect(typeof mod === "function").toBe(true);
    });

    test("require exists module: success", async () => {
      const modName = "bl";
      const modPath = Utils.setModulePath(modName, root);
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);

      const mod = await AutoImport.require(modName, { root });
      expect(typeof mod === "function").toBe(true);
    });

    test("require un-exists module: fail", async () => {
      const modName = "a-fail-module-error";
      const mod = await AutoImport.require(modName, { root, stdio: 'ignore' });
      expect(mod).toBe(null);
    });

    test("require exists & need update module: success", async () => {
      const modName = "koa@2.9.0";
      const [name] = Utils.formatModuleName(modName);
      const modPath = Utils.setModulePath(name, root);
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);

      const mod = await AutoImport.require(modName, { root });
      expect(typeof mod === "function").toBe(true);
    });

    test("require lower-version module: success", async () => {
      const modName = "koa@2.8.2";
      const [name] = Utils.formatModuleName(modName);
      const modPath = Utils.setModulePath(name, root);
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);

      const mod = await AutoImport.require(modName, { root });
      expect(typeof mod === "function").toBe(true);
    });

    test("require expired module: success", async () => {
      const modName = "koa";
      const [name] = Utils.formatModuleName(modName);
      const modPath = Utils.setModulePath(name, root);
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
      AutoImport.setModuleExpireTime(name, { root, expire: -100 });

      const mod = await AutoImport.require(modName);
      expect(typeof mod === "function").toBe(true);
    });

    test("require latest-version module: success", async () => {
      const modName = "react";
      const [name] = Utils.formatModuleName(modName);
      const modPkgPath = Utils.setModulePkgPath(name, root);
      expect(fs.existsSync(modPkgPath)).toBe(true);
      AutoImport.setModuleExpireTime(name, { root, expire: -100 });

      const mod = await AutoImport.require(modName);
      const pkg = Utils.readJSONSync(modPkgPath)
      expect(mod.version === pkg.version).toBe(true);
    });
  });
});
