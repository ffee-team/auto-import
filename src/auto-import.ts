import fs from "fs-extra";
import semver from "semver";
import request from "request";
import { spawnSync, StdioOptions } from "child_process";
import { Utils } from "./utils";

export namespace AutoImport {
  interface ModuleOptions {
    root?: string;
    expire?: number;
    version?: string;
  }

  interface InstallModuleOptions extends ModuleOptions {
    registry?: string;
    stdio?: StdioOptions;
  }

  interface RequireModuleOptions extends InstallModuleOptions {}

  interface ModuleExprireTimeOptions extends ModuleOptions {
    registry?: string;
  }

  /**
   * Get the latest package information of NPM module
   * @param {string} name NPM module name
   * @param {string} registry npm registry host, default = https://registry.npmjs.org
   * @returns {any}
   */
  export const getNpmInfo = async (
    name: string,
    registry: string = Utils.DEFAULT_REGISTRY
  ): Promise<any> => {
    const url = `${registry}/${encodeURIComponent(name)}/latest`;
    Utils.logger("getNpmInfo:", url);

    return new Promise((resolve, reject) =>
      request(url, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          if (response && response.statusCode === 200) {
            resolve(JSON.parse(body));
          } else {
            reject(JSON.parse(body));
          }
        }
      })
    );
  };

  export const setModuleExpireTime = (
    name: string,
    opts: ModuleExprireTimeOptions = {}
  ) => {
    const { root = Utils.DEFAULT_ROOT, expire } = opts;
    const [modName] = Utils.formatModuleName(name);
    const pkgPath = Utils.setModulePkgPath(modName, root);
    try {
      const pkgInfo = Utils.readJSONSync(pkgPath);
      pkgInfo.__expire = Utils.setExpireTime(expire);

      Utils.logger(`set ${name} expire-time ->`, pkgInfo.__expire);
      Utils.writeJSONSync(pkgPath, pkgInfo);
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Install npm module
   * @param {string} name
   * @param {InstallOptions} opts
   * @returns {Promise<boolean>}
   */
  export const install = async (
    name: string,
    opts: InstallModuleOptions = {}
  ): Promise<boolean> => {
    const {
      root = Utils.DEFAULT_ROOT,
      registry = Utils.DEFAULT_REGISTRY,
      expire,
      stdio,
      version,
      ...other
    } = opts;
    const installer = Utils.getNpmCommand("install");
    const installArray = [
      name,
      `--root=${root}`,
      `--registry=${registry}`,
      ...Utils.flatObject(other),
    ];
    try {
      spawnSync(installer, installArray, {
        stdio: stdio || "inherit",
      });
      return true;
    } catch (error: any) {
      Utils.logger(error.message);
    }

    return false;
  };

  export const installAndRequire = async (
    name: string,
    opts: RequireModuleOptions
  ) => {
    const { root = Utils.DEFAULT_ROOT, version, ...other } = opts;
    const modPath = Utils.setModulePath(name, root);
    const res = await install(name, opts);
    if (res) {
      setModuleExpireTime(name, opts);
      return Utils.globalRequire(modPath);
    } else {
      return null;
    }
  };

  export const require = async (
    name: string,
    opts: RequireModuleOptions = {}
  ): Promise<NodeRequire | null> => {
    const { root = Utils.DEFAULT_ROOT } = opts;
    const [modName, modVersion] = Utils.formatModuleName(name);
    const modPath = Utils.setModulePath(name, root);
    const modPkgPath = Utils.setModulePkgPath(modName, root);
    const localPkgInfo = Utils.readJSONSync(modPkgPath);
    // module not exists, instll now
    if (!localPkgInfo) {
      Utils.logger(name, "not exists, installing right now...");
      return await installAndRequire(modName, {
        version: modVersion,
        ...opts,
      });
    } else {
      if (modVersion) {
        if (semver.lt(localPkgInfo.version, modVersion)) {
          Utils.logger(
            "local module",
            name,
            "exists, but version lower, installing right now..."
          );
          return await installAndRequire(name, {
            version: modVersion,
            ...opts,
          });
        } else {
          Utils.logger("local module", name, "exists, required...");
          return Utils.globalRequire(modPath);
        }
      } else {
        // current module not expired, return current.
        if (
          localPkgInfo.__expire &&
          Utils.DEFAULT_TIME_NOW <= localPkgInfo.__expire
        ) {
          return Utils.globalRequire(modPath);
        }
        return await installAndRequire(modName, {
          ...opts,
        });
      }
    }
  };
}
