import { AutoImport } from "./auto-import";
import { Utils } from './utils';

export default {
  getNpmInfo(name: string, registry?: string) {
    return AutoImport.getNpmInfo(name, registry || Utils.DEFAULT_REGISTRY);
  },
  setModuleExpireTime(name: string, opts: AutoImport.ModuleExprireTimeOptions) {
    return AutoImport.setModuleExpireTime(name, opts || {});
  },
  require(name: string, opts?: AutoImport.InstallModuleOptions) {
    return AutoImport.require(name, opts || {});
  },
};
