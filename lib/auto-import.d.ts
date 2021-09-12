/// <reference types="node" />
import { StdioOptions } from "child_process";
export declare namespace AutoImport {
    interface ModuleOptions {
        root?: string;
        expire?: number;
        version?: string;
    }
    interface InstallModuleOptions extends ModuleOptions {
        registry?: string;
        stdio?: StdioOptions;
    }
    interface RequireModuleOptions extends InstallModuleOptions {
    }
    interface ModuleExprireTimeOptions extends ModuleOptions {
        registry?: string;
    }
    /**
     * Get the latest package information of NPM module
     * @param {string} name NPM module name
     * @param {string} registry npm registry host, default = https://registry.npmjs.org
     * @returns {any}
     */
    export const getNpmInfo: (name: string, registry?: string) => Promise<any>;
    export const setModuleExpireTime: (name: string, opts?: ModuleExprireTimeOptions) => boolean;
    /**
     * Install npm module
     * @param {string} name
     * @param {InstallOptions} opts
     * @returns {Promise<boolean>}
     */
    export const install: (name: string, opts?: InstallModuleOptions) => Promise<boolean>;
    export const installAndRequire: (name: string, opts: RequireModuleOptions) => Promise<NodeRequire | null>;
    export const require: (name: string, opts?: RequireModuleOptions) => Promise<NodeRequire | null>;
    export {};
}
