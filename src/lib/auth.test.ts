import { describe, expect, it } from "bun:test";
import { canTransitionCase } from "./auth";

describe("canTransitionCase", () => {
  it("should return true for valid transitions", () => {
    expect(canTransitionCase("draft", "submitted")).toBe(true);
    expect(canTransitionCase("draft", "rejected")).toBe(true);
    expect(canTransitionCase("submitted", "verifying")).toBe(true);
    expect(canTransitionCase("approved", "disbursing")).toBe(true);
    expect(canTransitionCase("rejected", "draft")).toBe(true);
  });

  it("should return false for invalid transitions", () => {
    expect(canTransitionCase("draft", "verified")).toBe(false); // Can't skip states
    expect(canTransitionCase("submitted", "draft")).toBe(false); // Can't go backwards unless rejected
    expect(canTransitionCase("closed", "draft")).toBe(false); // Closed has no transitions
    expect(canTransitionCase("approved", "approved")).toBe(false); // Can't transition to same state
  });

  it("should return false for unknown states", () => {
    expect(canTransitionCase("unknown_state", "submitted")).toBe(false);
    expect(canTransitionCase("draft", "unknown_state")).toBe(false);
    expect(canTransitionCase("unknown", "unknown")).toBe(false);
  });
});
