import { describe, it, expect } from "bun:test";
import { getPaginationParams } from "./api-response";

describe("getPaginationParams", () => {
  function createRequest(url: string) {
    return new Request(`http://localhost${url}`);
  }

  it("returns default values when no params are provided", () => {
    const req = createRequest("/api/users");
    const result = getPaginationParams(req);
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("parses valid page and limit", () => {
    const req = createRequest("/api/users?page=2&limit=20");
    const result = getPaginationParams(req);
    expect(result).toEqual({ page: 2, limit: 20, skip: 20 });
  });

  it("bounds page to a minimum of 1", () => {
    const req = createRequest("/api/users?page=0&limit=10");
    const result = getPaginationParams(req);
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 });

    const req2 = createRequest("/api/users?page=-5&limit=10");
    const result2 = getPaginationParams(req2);
    expect(result2).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it("bounds limit to a minimum of 1", () => {
    const req = createRequest("/api/users?page=1&limit=0");
    const result = getPaginationParams(req);
    expect(result).toEqual({ page: 1, limit: 1, skip: 0 });

    const req2 = createRequest("/api/users?page=1&limit=-10");
    const result2 = getPaginationParams(req2);
    expect(result2).toEqual({ page: 1, limit: 1, skip: 0 });
  });

  it("bounds limit to a maximum of 100", () => {
    const req = createRequest("/api/users?page=1&limit=101");
    const result = getPaginationParams(req);
    expect(result).toEqual({ page: 1, limit: 100, skip: 0 });

    const req2 = createRequest("/api/users?page=1&limit=500");
    const result2 = getPaginationParams(req2);
    expect(result2).toEqual({ page: 1, limit: 100, skip: 0 });
  });

  it("handles non-numeric inputs gracefully", () => {
    const req = createRequest("/api/users?page=abc&limit=def");
    const result = getPaginationParams(req);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(0);
  });
});
