"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const debug_1 = __importDefault(require("debug"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
var Utils;
(function (Utils) {
    Utils.DEFAULT_TIME_NOW = Date.now();
    Utils.DEFAULT_ROOT = process.cwd();
    Utils.DEFAULT_REGISTRY = "https://registry.npmjs.org";
    Utils.logger = (...args) => {
        return (0, debug_1.default)("auto-import:")(args.join(" "));
    };
    Utils.globalRequire = (id) => require(id);
    Utils.getNpmCommand = (cmd) => {
        return require.resolve(`npminstall/bin/${cmd}.js`);
    };
    Utils.flatObject = (obj) => {
        const res = [];
        for (const v in obj) {
            res.push(`--${v}=${obj[v]}`);
        }
        return res;
    };
    Utils.setModulePath = (name, dir = Utils.DEFAULT_ROOT) => path_1.default.join(dir, "node_modules", name);
    Utils.setModulePkgPath = (name, dir = Utils.DEFAULT_ROOT) => path_1.default.join(Utils.setModulePath(name, dir), "package.json");
    /**
     * set expire time
     * @param {number} expireTime module expire time
     */
    Utils.setExpireTime = (expireTime = 3600) => {
        return Utils.DEFAULT_TIME_NOW + expireTime * 1000;
    };
    /**
     * format npm module name
     * @param {string} name name@1.0.0 => ['name', '1.0.0']
     * @returns {string[]} [module_name, module_version]
     */
    Utils.formatModuleName = (name) => {
        const index = name.lastIndexOf("@");
        if (index > 0) {
            return [name.slice(0, index), name.slice(index + 1)];
        }
        return [name];
    };
    Utils.readJSONSync = (pkgPath) => {
        try {
            return fs_extra_1.default.readJSONSync(pkgPath);
        }
        catch (error) {
            Utils.logger("Read JSON Error:", error.message);
            return null;
        }
    };
    Utils.writeJSONSync = (pkgPath, data) => {
        try {
            fs_extra_1.default.writeJSONSync(pkgPath, data);
            return true;
        }
        catch (error) {
            Utils.logger("Write JSON Error:", error.message);
            return false;
        }
    };
})(Utils = exports.Utils || (exports.Utils = {}));
