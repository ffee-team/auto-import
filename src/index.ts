import { AutoImport } from "./auto-import";

export = {
  getNpmInfo: AutoImport.getNpmInfo,
  setModuleExpireTime: AutoImport.setModuleExpireTime,
  checkModuleUpdateStatus: AutoImport.checkModuleUpdateStatus,
  require: AutoImport.require,
};
