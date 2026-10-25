import { describe, expect, it } from "vitest";
import { credentialVersion, ownerSessionValid, passwordMatches } from "@/lib/owner-gate.server";

describe("Owner password gate", () => {
  it("accepts only the exact configured password, never a prefix or case variation", () => {
    const fixture = "example-owner-password";
    expect(passwordMatches(fixture, fixture)).toBe(true);
    expect(passwordMatches("example-owner", fixture)).toBe(false);
    expect(passwordMatches("Example-owner-password", fixture)).toBe(false);
    expect(passwordMatches("", fixture)).toBe(false);
  });
  it("denies missing or forged owner sessions", () => {
    expect(ownerSessionValid({}, "fixture-version")).toBe(false);
    expect(ownerSessionValid({ unlocked: true }, "fixture-version")).toBe(false);
    expect(ownerSessionValid({ unlocked: true, version: "forged" }, "fixture-version")).toBe(false);
  });
  it("invalidates an old session when the owner password changes", () => {
    const oldVersion = credentialVersion("old-example-password", "test-session-key");
    const newVersion = credentialVersion("new-example-password", "test-session-key");
    expect(ownerSessionValid({ unlocked: true, version: oldVersion }, oldVersion)).toBe(true);
    expect(ownerSessionValid({ unlocked: true, version: oldVersion }, newVersion)).toBe(false);
  });
});