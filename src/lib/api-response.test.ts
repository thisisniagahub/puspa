import { describe, expect, it } from "bun:test";
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  getPaginationParams,
  buildPagination,
} from "./api-response";

describe("api-response", () => {
  describe("apiSuccess", () => {
    it("should return a successful response with data", async () => {
      const data = { user: "john" };
      const response = apiSuccess(data);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ data });
    });

    it("should return a successful response with data, message and custom status", async () => {
      const data = { user: "john" };
      const response = apiSuccess(data, { message: "User found", status: 202 });

      expect(response.status).toBe(202);

      const body = await response.json();
      expect(body).toEqual({ data, message: "User found" });
    });

    it("should return a successful response with pagination", async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, limit: 10, total: 2, totalPages: 1 };
      const response = apiSuccess(data, { pagination });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ data, pagination });
    });
  });

  describe("apiCreated", () => {
    it("should return a 201 response with default message", async () => {
      const data = { id: 1 };
      const response = apiCreated(data);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toEqual({ data, message: "Berjaya dicipta" });
    });

    it("should return a 201 response with custom message", async () => {
      const data = { id: 1 };
      const response = apiCreated(data, "Custom created message");

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toEqual({ data, message: "Custom created message" });
    });
  });

  describe("apiError", () => {
    it("should return a 400 error response with default status", async () => {
      const response = apiError("Bad request");

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({ error: "Bad request" });
    });

    it("should return an error response with custom status and details", async () => {
      const details = { field: "username", error: "Required" };
      const response = apiError("Validation failed", 422, details);

      expect(response.status).toBe(422);

      const body = await response.json();
      expect(body).toEqual({ error: "Validation failed", details });
    });
  });

  describe("apiNotFound", () => {
    it("should return a 404 response with default message", async () => {
      const response = apiNotFound();

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({ error: "Tidak dijumpai" });
    });

    it("should return a 404 response with custom message", async () => {
      const response = apiNotFound("User not found");

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({ error: "User not found" });
    });
  });

  describe("apiUnauthorized", () => {
    it("should return a 401 response with default message", async () => {
      const response = apiUnauthorized();

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ error: "Tidak dibenarkan" });
    });
  });

  describe("apiForbidden", () => {
    it("should return a 403 response with default message", async () => {
      const response = apiForbidden();

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body).toEqual({ error: "Tiada kebenaran" });
    });
  });

  describe("getPaginationParams", () => {
    it("should return default pagination params when no search params are provided", () => {
      const request = new Request("http://localhost/api/users");
      const params = getPaginationParams(request);

      expect(params).toEqual({ page: 1, limit: 10, skip: 0 });
    });

    it("should parse page and limit from search params", () => {
      const request = new Request("http://localhost/api/users?page=2&limit=20");
      const params = getPaginationParams(request);

      expect(params).toEqual({ page: 2, limit: 20, skip: 20 });
    });

    it("should handle invalid or out-of-bounds page and limit values", () => {
      const request = new Request("http://localhost/api/users?page=-1&limit=200");
      const params = getPaginationParams(request);

      // page should be at least 1, limit should be max 100
      expect(params).toEqual({ page: 1, limit: 100, skip: 0 });
    });
  });

  describe("buildPagination", () => {
    it("should build pagination info", () => {
      const info = buildPagination(2, 10, 55);

      expect(info).toEqual({
        page: 2,
        limit: 10,
        total: 55,
        totalPages: 6, // Math.ceil(55 / 10)
      });
    });
  });
});
