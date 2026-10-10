import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { CONTRACT_ADDRESS, STUDIO_DEV } from "./networks";

describe("live contract configuration", () => {
  test("targets the user's new contract", () => {
    assert.equal(CONTRACT_ADDRESS, "0x67e11351025448acD773B0CcF8FA6aFF47eEd94F");
  });

  test("uses Studio Dev exclusively", () => {
    assert.equal(STUDIO_DEV.id, "studio-dev");
    assert.equal(STUDIO_DEV.rpcUrl, "https://studio-dev.genlayer.com/api");
    assert.equal(STUDIO_DEV.chainId, 61997);
  });
});