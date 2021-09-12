import { Utils } from "../src/utils";
import { AutoImport } from "../src/auto-import";

describe("#auto-import tester", () => {
  beforeAll(() => {
    (Utils as any).logger = (...args: string[]) => {
      return args.join(" ");
    };
  });
  describe("#method: install", () => {
    test("install a module success: install('express')", async () => {
      const modName = "express";
      const res = await AutoImport.install(modName);
      const modPath = Utils.setModulePath(modName);
      const mod = Utils.globalRequire(modPath);

      expect(res).toEqual(true);
      expect(typeof mod === "function").toBe(true);
    });

    test("install a module success: install('koa', __dirname)", async () => {
      const modName = "koa";
      const root = __dirname;
      const res = await AutoImport.install(modName, { root });
      const modPath = Utils.setModulePath(modName, root);
      const mod = Utils.globalRequire(modPath);

      expect(res).toEqual(true);
      expect(typeof mod === "function").toBe(true);
    });
  });
});
