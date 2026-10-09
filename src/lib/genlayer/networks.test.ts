import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { CONTRACT_ADDRESS, STUDIO_DEV } from "./networks";

describe("live contract configuration", () => {
  test("targets the user's new contract", () => {
    assert.equal(CONTRACT_ADDRESS, "0x6270f106b3B7CCa85D305b7Afcdb98Be294dc207");
  });

  test("uses Studio Dev exclusively", () => {
    assert.equal(STUDIO_DEV.id, "studio-dev");
    assert.equal(STUDIO_DEV.rpcUrl, "https://studio-dev.genlayer.com/api");
    assert.equal(STUDIO_DEV.chainId, 61997);
  });
});