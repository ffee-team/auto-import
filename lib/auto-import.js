"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoImport = void 0;
const semver_1 = __importDefault(require("semver"));
const request_1 = __importDefault(require("request"));
const child_process_1 = require("child_process");
const utils_1 = require("./utils");
var AutoImport;
(function (AutoImport) {
    /**
     * Get the latest package information of NPM module
     * @param {string} name NPM module name
     * @param {string} registry npm registry host, default = https://registry.npmjs.org
     * @returns {any}
     */
    AutoImport.getNpmInfo = (name, registry = utils_1.Utils.DEFAULT_REGISTRY) => __awaiter(this, void 0, void 0, function* () {
        const url = `${registry}/${encodeURIComponent(name)}/latest`;
        utils_1.Utils.logger("getNpmInfo:", url);
        return new Promise((resolve, reject) => (0, request_1.default)(url, (error, response, body) => {
            if (error) {
                reject(error);
            }
            else {
                if (response && response.statusCode === 200) {
                    resolve(JSON.parse(body));
                }
                else {
                    reject(JSON.parse(body));
                }
            }
        }));
    });
    AutoImport.setModuleExpireTime = (name, opts = {}) => {
        const { root = utils_1.Utils.DEFAULT_ROOT, expire } = opts;
        const [modName] = utils_1.Utils.formatModuleName(name);
        const pkgPath = utils_1.Utils.setModulePkgPath(modName, root);
        try {
            const pkgInfo = utils_1.Utils.readJSONSync(pkgPath);
            pkgInfo.__expire = utils_1.Utils.setExpireTime(expire);
            utils_1.Utils.logger(`set ${name} expire-time ->`, pkgInfo.__expire);
            utils_1.Utils.writeJSONSync(pkgPath, pkgInfo);
            return true;
        }
        catch (error) {
            return false;
        }
    };
    /**
     * Install npm module
     * @param {string} name
     * @param {InstallOptions} opts
     * @returns {Promise<boolean>}
     */
    AutoImport.install = (name, opts = {}) => __awaiter(this, void 0, void 0, function* () {
        const { root = utils_1.Utils.DEFAULT_ROOT, registry = utils_1.Utils.DEFAULT_REGISTRY, expire, stdio, version } = opts, other = __rest(opts, ["root", "registry", "expire", "stdio", "version"]);
        const installer = utils_1.Utils.getNpmCommand("install");
        const installArray = [
            name,
            `--root=${root}`,
            `--registry=${registry}`,
            ...utils_1.Utils.flatObject(other),
        ];
        try {
            (0, child_process_1.spawnSync)(installer, installArray, {
                stdio: stdio || "inherit",
            });
            return true;
        }
        catch (error) {
            utils_1.Utils.logger(error.message);
        }
        return false;
    });
    AutoImport.installAndRequire = (name, opts) => __awaiter(this, void 0, void 0, function* () {
        const { root = utils_1.Utils.DEFAULT_ROOT, version } = opts, other = __rest(opts, ["root", "version"]);
        const modPath = utils_1.Utils.setModulePath(name, root);
        const res = yield AutoImport.install(name, opts);
        if (res) {
            AutoImport.setModuleExpireTime(name, opts);
            return utils_1.Utils.globalRequire(modPath);
        }
        else {
            return null;
        }
    });
    AutoImport.require = (name, opts = {}) => __awaiter(this, void 0, void 0, function* () {
        const { root = utils_1.Utils.DEFAULT_ROOT } = opts;
        const [modName, modVersion] = utils_1.Utils.formatModuleName(name);
        const modPath = utils_1.Utils.setModulePath(name, root);
        const modPkgPath = utils_1.Utils.setModulePkgPath(modName, root);
        const localPkgInfo = utils_1.Utils.readJSONSync(modPkgPath);
        // module not exists, instll now
        if (!localPkgInfo) {
            utils_1.Utils.logger(name, "not exists, installing right now...");
            return yield AutoImport.installAndRequire(modName, Object.assign({ version: modVersion }, opts));
        }
        else {
            if (modVersion) {
                if (semver_1.default.lt(localPkgInfo.version, modVersion)) {
                    utils_1.Utils.logger("local module", name, "exists, but version lower, installing right now...");
                    return yield AutoImport.installAndRequire(name, Object.assign({ version: modVersion }, opts));
                }
                else {
                    utils_1.Utils.logger("local module", name, "exists, required...");
                    return utils_1.Utils.globalRequire(modPath);
                }
            }
            else {
                // current module not expired, return current.
                if (localPkgInfo.__expire &&
                    utils_1.Utils.DEFAULT_TIME_NOW <= localPkgInfo.__expire) {
                    return utils_1.Utils.globalRequire(modPath);
                }
                return yield AutoImport.installAndRequire(modName, Object.assign({}, opts));
            }
        }
    });
})(AutoImport = exports.AutoImport || (exports.AutoImport = {}));
