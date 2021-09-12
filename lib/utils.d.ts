export declare namespace Utils {
    const DEFAULT_TIME_NOW: number;
    const DEFAULT_ROOT: string;
    const DEFAULT_REGISTRY = "https://registry.npmjs.org";
    const logger: (...args: string[]) => void;
    const globalRequire: (id: string) => NodeRequire;
    const getNpmCommand: (cmd: string) => string;
    const flatObject: (obj: {
        [x: string]: any;
    }) => string[];
    const setModulePath: (name: string, dir?: string) => string;
    const setModulePkgPath: (name: string, dir?: string) => string;
    /**
     * set expire time
     * @param {number} expireTime module expire time
     */
    const setExpireTime: (expireTime?: number) => number;
    /**
     * format npm module name
     * @param {string} name name@1.0.0 => ['name', '1.0.0']
     * @returns {string[]} [module_name, module_version]
     */
    const formatModuleName: (name: string) => string[];
    const readJSONSync: (pkgPath: string) => any;
    const writeJSONSync: (pkgPath: string, data: any) => boolean;
}
