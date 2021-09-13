import path from "path";
import fs from "fs-extra";
import { Utils } from "../src/utils";
import { AutoImport } from "../src/auto-import";
import { execSync } from 'child_process';

describe("#auto-import tester", () => {
  beforeAll(() => {
    (Utils as any).logger = (...args: string[]) => {
      return args.join(" ");
    };
  });
  
  afterAll(() => {
    execSync('rm -rf ' + path.join(__dirname, 'node_modules'));
  });

  describe("#method: getNpmInfo", () => {
    test('getNpmInfo success:', async() => {
      const modName = "express";
      const res1 = await AutoImport.getNpmInfo(modName);
      expect(res1.status).toBe(true);
      expect(res1.data.name).toBe(modName);

      const res2 = await AutoImport.getNpmInfo(modName, 'https://registry.npm.taobao.org');
      expect(res2.status).toBe(true);
      expect(res2.data.name).toBe(modName);
    });

    test('getNpmInfo fail: get a not-exist-module', async() => {
      const modName = "not-exist-modules-ab";
      const res = await AutoImport.getNpmInfo(modName, 'https://registry.npm.taobao.org');
      expect(res.status).toBe(false);
      expect(res.code).toBe(404);
      expect(res.error).toBe(null);
    });
    
    test('getNpmInfo fail: get from error registry host', async() => {
      const modName = "not-exist-modules-abc";
      const res = await AutoImport.getNpmInfo(modName, 'https://registry.npm.error-host.org');
      expect(res.status).toBe(false);
      expect(res.code).toBe(500);
      expect(res.error.code).toBe('ENOTFOUND');
    });
  });

  describe("#method: setModuleExpireTime", () => {
    const modName = "react";
    const root = __dirname;
    const expire = 2000;
    beforeAll(async() => {
      // await AutoImport.install(modName, { root });
    });

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
      await AutoImport.install(modName, { root });
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
    });
  });

  describe("#method: install", () => {
    test("install a module success: install('express')", async () => {
      const modName = "express";
      const res = await AutoImport.install(modName);
      const modPath = Utils.setModulePath(modName);
      const mod = Utils.globalRequire(modPath);

      expect(res).toEqual(true);
      expect(typeof mod === "function").toBe(true);
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
    });

    test("install a module success: install('koa', __dirname)", async () => {
      const modName = "koa";
      const root = __dirname;
      const res = await AutoImport.install(modName, { root });
      const modPath = Utils.setModulePath(modName, root);
      const mod = Utils.globalRequire(modPath);

      expect(res).toEqual(true);
      expect(typeof mod === "function").toBe(true);
      expect(fs.existsSync(modPath + '/package.json')).toBe(true);
    });
  });

  describe("#method: installAndRequire", () => {
    test("install a module success: install('express')", async () => {
      
    });

    test("install a module success: install('koa', __dirname)", async () => {
   
    });
  });
});
