import { describe, expect, it } from "bun:test";
import { hasPermission, ROLES } from "./auth";
import type { Permission } from "./auth";

describe("hasPermission", () => {
  it("should return true when the role has the permission", () => {
    expect(hasPermission(ROLES.ADMIN, "cases:create")).toBe(true);
    expect(hasPermission(ROLES.OPS, "cases:create")).toBe(true);
    expect(hasPermission(ROLES.VOLUNTEER, "cases:create")).toBe(true);
  });

  it("should return false when the role does not have the permission", () => {
    expect(hasPermission(ROLES.FINANCE, "cases:create")).toBe(false);
    expect(hasPermission(ROLES.VOLUNTEER, "cases:delete")).toBe(false);
  });

  it("should safely return false when an invalid permission is checked", () => {
    // @ts-expect-error - we want to test invalid inputs
    expect(hasPermission(ROLES.ADMIN, "nonexistent:permission")).toBe(false);
  });

  it("should safely return false when an invalid role is provided", () => {
    // @ts-expect-error - we want to test invalid inputs
    expect(hasPermission("guest", "cases:read")).toBe(false);
  });
});
