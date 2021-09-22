import semver from "semver";
import http from "http";
import https from "https";
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

  /**
   * Get the latest package information of NPM module
   * @param {string} name Node module name
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
    const request = url.startsWith('https') ? https : http;

    return new Promise((resolve) => {
      request.get(url, (res) => {
        res.setEncoding('utf8');
        if (res.statusCode !== 200) {
          resolve({
            status: false,
            code: res.statusCode,
            error: null
          });
        } else {
          let chunk = '';
          res.on('data', c => chunk += c)
            .on('end', () => resolve(Utils.catchJSONparse(chunk)));
        }
      }).on('error', (err) => resolve(Utils.catchError(err)))
    });
  };

  /**
   * Set the expiration time of the module
   * 
   * @param {string} name Node module name
   * @param {ModuleOptions} opts 
   * @returns {boolean}
   */
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
   * @param {string} name Node module name
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

  export interface UpdateStatus {
    // Node module name
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
   * @param {string} name Node module name
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
        name: modName,
        status: true,
        message: `${name} had not existed, install right now...`,
      };
    }

    if (modVersion) {
      if (semver.lt(localPkgInfo.version, modVersion)) {
        return {
          name: modName,
          status: true,
          message: `${name} has existed, but version is low, install right now...`,
        };
      } else {
        return {
          name: modName,
          status: false,
          message: `${name} has existed a higher version, return currect now...`,
        };
      }
    } else {
      if (localPkgInfo.__expire && localPkgInfo.__expire >= Utils.DEFAULT_TIME_NOW) {
        return {
          name: modName,
          status: false,
          message: `${name} had not expired, return current...`,
        };
      }

      const pkgInfo = await getNpmInfo(modName);
      if (pkgInfo.status && semver.lt(localPkgInfo.version, pkgInfo.data.version)) {
        return {
          name: modName,
          status: true,
          message: `${name} had expired, install and require...`,
          latest: pkgInfo.data.version,
        };
      }

      return {
        status: false,
        name: modName,
        message: `${name} had expired, but version is latest, return current...`,
        latest: pkgInfo.data.version,
      };
    }
  };

  /**
   * require node modeule
   * @desc Require the node module. If the module is not installed, install it automatically before loading it.
   * 
   * @param {string} name Node module name
   * @param {InstallModuleOptions} opts
   * @returns {Promise<any>}
   */
  export const require = async (
    name: string,
    opts: InstallModuleOptions = {}
  ): Promise<any> => {
    const { root = Utils.DEFAULT_ROOT } = opts;
    const result = await checkModuleUpdateStatus(name, opts);
    const modPath = Utils.setModulePath(result.name, root);

    Utils.logger(result.message);
    if (result.status) {
      install(name, opts);
    }

    if (result.latest) {
      setModuleExpireTime(result.name, opts);
    }

    return Utils.globalRequire(modPath);
  };
}
