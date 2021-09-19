import debug from "debug";
import fs from "fs-extra";
import path from "path";

export namespace Utils {
  export const DEFAULT_TIME_NOW = Date.now();
  export const DEFAULT_ROOT = process.cwd();
  export const DEFAULT_REGISTRY = "https://registry.npmjs.org";

  export const logger = (...args: string[]) => {
    return debug("auto-import:")(args.join(" "));
  };

  export const globalRequire = (id: string) => {
    try {
      return require(id)
    } catch (error: any) {
      logger(error.message);
      return null;
    }
  };

  export const getNpmCommand = (cmd: string) => {
    return require.resolve(`npminstall/bin/${cmd}.js`);
  };

  export const flatObject = (obj: { [x: string]: any }) => {
    const res = [];
    for (const v in obj) {
      res.push(`--${v}=${obj[v]}`);
    }
    return res;
  };

  export const setModulePath = (name: string, dir: string = DEFAULT_ROOT) =>
    path.join(dir, "node_modules", name);

  export const setModulePkgPath = (name: string, dir: string = DEFAULT_ROOT) =>
    path.join(setModulePath(name, dir), "package.json");

  /**
   * set expire time
   * @param {number} expireTime module expire time
   */
  export const setExpireTime = (expireTime: number) => {
    return DEFAULT_TIME_NOW + expireTime * 1000;
  };

  /**
   * format npm module name
   * @param {string} name name@1.0.0 => ['name', '1.0.0']
   * @returns {string[]} [module_name, module_version]
   */
  export const formatModuleName = (name: string) => {
    const index = name.lastIndexOf("@");
    if (index > 0) {
      return [name.slice(0, index), name.slice(index + 1)];
    }
    return [name];
  };

  export const readJSONSync = (jsonPath: string) => {
    try {
      return fs.readJSONSync(jsonPath);
    } catch (error: any) {
      logger("Read JSON Error:", error.message);
      return null;
    }
  };

  export const writeJSONSync = (jsonPath: string, json: any) => {
    fs.writeJSONSync(jsonPath, json);
    return true;
  };
}
