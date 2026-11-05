import { describe, expect, test } from "bun:test";
import { ACCESS_KEY, ACCESS_VERSION, hasRememberedAccess, matchesPasscode } from "./prototype-access";

describe("casual prototype access", () => {
  test("incorrect and empty codes do not unlock", async () => {
    expect(await matchesPasscode("incorrect-code")).toBe(false);
    expect(await matchesPasscode("")).toBe(false);
  });
  test("remembered access survives releases with the same code", () => {
    expect(hasRememberedAccess({ getItem: key => key === ACCESS_KEY ? ACCESS_VERSION : null })).toBe(true);
  });
  test("a fresh browser or an obsolete code prompts again", () => {
    expect(hasRememberedAccess({ getItem: () => null })).toBe(false);
    expect(hasRememberedAccess({ getItem: () => "old-version" })).toBe(false);
  });
  test("blocked browser storage still shows the gate", () => {
    expect(hasRememberedAccess({ getItem: () => { throw new Error("blocked"); } })).toBe(false);
  });
});