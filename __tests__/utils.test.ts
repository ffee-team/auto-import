import fs from "fs-extra";
import path from "path";
import http from "http";
import debug from "debug";
import { Utils } from "../src/utils";

describe("#Utils tester", () => {
  describe("#static: DEFAULT", () => {
    test("DEFAULT_TIME_NOW", async () => {
      expect(Utils.DEFAULT_TIME_NOW < Date.now()).toEqual(true);
    });
    test("DEFAULT_ROOT", async () => {
      expect(process.cwd()).toEqual(Utils.DEFAULT_ROOT);
    });
    test("DEFAULT_REGISTRY", async () => {
      expect(Utils.DEFAULT_REGISTRY === "https://registry.npmjs.org").toEqual(
        true
      );
    });
  });

  describe("Utils.logger", () => {
    const logger = Utils.logger.bind(null);
    beforeAll(() => {
      (Utils as any).logger = (...args: string[]) => {
        return args.join(" ");
      };
    });
    afterAll(() => {
      (Utils as any).logger = logger;
    });
    test("Utils.logger('message1', 'message2')", async () => {
      const msg = ["message1", "message2"];
      const log = Utils.logger(...msg);
      expect(log).toEqual(msg.join(" "));
    });

    test("Utils.logger('message1', 'message2')", async () => {
      const msg = ["message1", "message2"];
      const log1 = debug("auto-import:")(msg.join(" "));
      const log2 = logger(...msg);

      expect(log1).toEqual(log2);
    });
  });

  describe("Utils.globalRequire", () => {
    test("Utils.globalRequire: success", async () => {
      const res = Utils.globalRequire("debug");
      expect(res.debug).toEqual(res.default);
    });

    test("Utils.globalRequire: fail", async () => {
      const res = Utils.globalRequire("un-exist-module-xxx");
      expect(res).toEqual(null);
    });
  });

  describe("Utils.getNpmCommand", () => {
    test("Utils.getNpmCommand('install')", async () => {
      const cmd = Utils.getNpmCommand("install");
      expect(cmd.endsWith("node_modules/npminstall/bin/install.js")).toEqual(
        true
      );
    });

    test("Utils.getNpmCommand('uninstall')", async () => {
      const cmd = Utils.getNpmCommand("uninstall");
      expect(cmd.endsWith("node_modules/npminstall/bin/uninstall.js")).toEqual(
        true
      );
    });
  });

  describe("Utils.flatObject", () => {
    test("Utils.flatObject({a:'b',c:'d'})", async () => {
      const res = Utils.flatObject({ a: "b", c: "d" });
      expect(res[0]).toEqual("--a=b");
      expect(res[1]).toEqual("--c=d");
    });
  });

  describe("Utils.setModulePath", () => {
    const modName = "test";
    test("Utils.setModulePath('test')", async () => {
      const modPath = Utils.setModulePath(modName);
      expect(path.join(process.cwd(), "node_modules", modName)).toEqual(
        modPath
      );
    });
    test("Utils.setModulePath('test', __dirname)", async () => {
      const modPath = Utils.setModulePath("test", __dirname);
      expect(path.join(__dirname, "node_modules", modName)).toEqual(modPath);
    });
  });

  describe("Utils.setModulePkgPath", () => {
    const modName = "test";
    test("Utils.setModulePkgPath('test')", async () => {
      const modPath = Utils.setModulePkgPath(modName);
      expect(
        path.join(process.cwd(), "node_modules", modName, "package.json")
      ).toEqual(modPath);
    });
    test("Utils.setModulePkgPath('test', __dirname)", async () => {
      const modPath = Utils.setModulePkgPath("test", __dirname);
      expect(
        path.join(__dirname, "node_modules", modName, "package.json")
      ).toEqual(modPath);
    });
  });

  describe("Utils.setExpireTime", () => {
    test("Utils.setExpireTime(1000)", async () => {
      const time = Utils.setExpireTime(1000);
      expect(time).toEqual(Utils.DEFAULT_TIME_NOW + 1000 * 1000);
    });
  });

  describe("Utils.formatModuleName", () => {
    test("Utils.formatModuleName('test')", async () => {
      const names = Utils.formatModuleName("test");
      expect(names).toEqual(["test"]);
    });
    test("Utils.formatModuleName('test@1.2.3')", async () => {
      const names = Utils.formatModuleName("test@1.2.3");
      expect(names).toEqual(["test", "1.2.3"]);
    });
  });

  describe("Utils.readJSONSync", () => {
    test("Utils.readJSONSync: success", async () => {
      const result = Utils.readJSONSync(Utils.DEFAULT_ROOT + "/package.json");
      expect(result.name).toEqual("@ffee/auto-import");
    });
    test("Utils.readJSONSync: fail", async () => {
      const result = Utils.readJSONSync("./notest.json");
      expect(result).toEqual(null);
    });
  });

  describe("Utils.writeJSONSync", () => {
    const file = __dirname + "/package.json";
    const data = {
      name: "auto-import-tester",
    };
    afterAll(() => {
      fs.removeSync(file);
    });
    test("Utils.writeJSONSync: success", async () => {
      const result = Utils.writeJSONSync(file, data);
      const jsonString = fs.readFileSync(file).toString();

      expect(result).toEqual(true);
      expect(JSON.parse(jsonString)).toEqual(data);
    });
  });

  describe("Utils.catchError", () => {
    test("Utils.catchError: default", async () => {
      const result = Utils.catchError({}, 500);
      expect(result.status).toBe(false);
      expect(result.code).toBe(500);
    });
    test("Utils.catchError: -3008", async () => {
      const err = new Promise((resolve) => {
        http.get('http://no-exists-web.xx.xxx.xx').on('error', (error) => {
          resolve(error);
        });
      });

      const result = Utils.catchError(await err);
      expect(result.status).toBe(false);
      expect(result.code).toBe(-3008);
    });
  });

  describe("Utils.catchJSONparse", () => {
    test("Utils.catchJSONparse: true", async () => {
      const result = Utils.catchJSONparse("{}");
      expect(result.status).toBe(true);
      expect(result.code).toBe(200);
    });
    test("Utils.catchError: false", async () => {
      const result = Utils.catchJSONparse("{12121=2323}");
      expect(result.status).toBe(false);
      expect(result.code).toBe(-200);
    });
  });
});
