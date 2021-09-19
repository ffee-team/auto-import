// import fs from "fs-extra";
import semver from "semver";
import request from "request";
import { spawnSync, StdioOptions } from "child_process";
import { Utils } from "./utils";

export namespace AutoImport {
  export interface ModuleOptions {
    /**
     * Node module root dir
     * @default process.cwd()
     */
    root?: string;
    /**
     * NPM registry host
     * @default https://registry.npmjs.org
     */
    registry?: string;

    /**
     * Node Module expiration time
     */
    expire?: number;
  }

  export interface InstallModuleOptions extends ModuleOptions {
    stdio?: StdioOptions;
  }

  // export interface RequireModuleOptions extends InstallModuleOptions { }

  // export interface ModuleExprireTimeOptions extends ModuleOptions { }

  /**
   * Get the latest package information of NPM module
   * @param {string} name NPM module name
   * @param {string} registry npm registry host
   *    @default https://registry.npmjs.org
   * @returns {any}
   */
  export const getNpmInfo = async (
    name: string,
    registry: string = Utils.DEFAULT_REGISTRY
  ): Promise<any> => {
    const url = `${registry}/${encodeURIComponent(name)}/latest`;
    Utils.logger("getNpmInfo:", url);

    return new Promise((resolve) =>
      request(url, (error, response, body) => {
        if (error) {
          resolve({
            status: false,
            code: 500,
            error: JSON.parse(JSON.stringify(error))
          });
        } else {
          if (response && response.statusCode === 200 && body) {
            resolve({
              status: true,
              code: 200,
              data: JSON.parse(body)
            });
          } else {
            resolve({
              status: false,
              code: response.statusCode,
              error: null
            });
          }
        }
      })
    );
  };

  export const setModuleExpireTime = (
    name: string,
    opts: ModuleOptions = {}
  ) => {
    const { root = Utils.DEFAULT_ROOT, expire = 3600 * 24 } = opts;
    const pkgPath = Utils.setModulePkgPath(name, root);
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
   */
  export const install = async (
    name: string,
    opts: InstallModuleOptions = {}
  ) => {
    const {
      root = Utils.DEFAULT_ROOT,
      registry = Utils.DEFAULT_REGISTRY,
      expire,
      stdio,
      ...other
    } = opts;
    const installer = Utils.getNpmCommand("install");
    const installArray = [
      name,
      `--root=${root}`,
      `--registry=${registry}`,
      ...Utils.flatObject(other),
    ];

    spawnSync(installer, installArray, {
      stdio: stdio || "inherit",
    });
  };

  /**
   * install NPM module and require it.
   * @param {string} name 
   * @param {InstallModuleOptions} opts 
   * @returns {any}
   */
  export const installAndRequire = (
    name: string,
    opts: InstallModuleOptions = {}
  ): any => {
    install(name, opts);

    const { root = Utils.DEFAULT_ROOT } = opts;
    const [modName] = Utils.formatModuleName(name);
    const modPath = Utils.setModulePath(modName, root);
    setModuleExpireTime(modName, opts);

    return Utils.globalRequire(modPath);
  };

  export interface UpdateStatus {
    // npm module name
    name: string;
    /**
     * NPM module necessary to update?
     */
    status: boolean;
    /**
     * checked tips
     */
    message: string;

    /**
     * latest version of NPM module
     */
    latest?: string;
  }
  /**
   * Check whether the NPM module needs to be updated
   * @param {string} name npm module name
   * @param {ModuleOptions} opts
   * @returns {Promise<UpdateStatus>}
   */
  export const checkModuleUpdateStatus = async (
    name: string,
    opts: ModuleOptions = {},
  ): Promise<UpdateStatus> => {
    const { root = Utils.DEFAULT_ROOT } = opts;
    const [modName, modVersion] = Utils.formatModuleName(name);
    const modPkgPath = Utils.setModulePkgPath(modName, root);
    const localPkgInfo = Utils.readJSONSync(modPkgPath);

    if (!localPkgInfo) {
      return {
        status: true,
        name: modName,
        message: `${name} not existed, install right now...`,
      };
    }

    if (modVersion) {
      if (semver.lt(localPkgInfo.version, modVersion)) {
        return {
          status: true,
          name: modName,
          message: `${name} has existed, but version is low, install right now...`,
        };
      } else {
        return {
          status: false,
          name: modName,
          message: `${name} has existed a higher version, return currect now...`,
        };
      }
    } else {
      console.log('localPkgInfo.__expire', localPkgInfo.__expire);

      if (localPkgInfo.__expire && localPkgInfo.__expire >= Utils.DEFAULT_TIME_NOW) {
        return {
          status: false,
          name: modName,
          message: `${name} not expired, return current...`,
        };
      }

      const pkgInfo = await getNpmInfo(modName);
      if (pkgInfo.status && semver.lt(localPkgInfo.version, pkgInfo.data.version)) {
        return {
          status: true,
          name: modName,
          message: `${name} expired, install and require...`,
          latest: pkgInfo.data.version,
        };
      }

      return {
        status: false,
        name: modName,
        message: `${name} expired, but version is latest, return current...`,
        latest: pkgInfo.data.version,
      };
    }
  };

  export const require = async (
    name: string,
    opts: InstallModuleOptions = {}
  ): Promise<any> => {
    const { root = Utils.DEFAULT_ROOT } = opts;
    const result = await checkModuleUpdateStatus(name, opts);
    const modPath = Utils.setModulePath(result.name, root);

    Utils.logger(result.message);
    if (result.status) {
      return installAndRequire(name, opts);
    }

    return Utils.globalRequire(modPath);
  };
}
