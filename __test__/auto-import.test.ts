import { Utils } from "../src/utils";
import { AutoImport } from "../src/auto-import";

describe("#auto-import tester", () => {
  beforeAll(() => {
    console.log(Utils);
    console.log(AutoImport);
  });
  describe("#method: install", () => {
    test("install a module success: install('express')", async () => {
      const res = await AutoImport.install("express");
      expect(res).toEqual(true);
    });
  });
});
