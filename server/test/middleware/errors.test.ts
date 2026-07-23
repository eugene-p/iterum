import { describe, expect, it } from "vitest";
import { AppError, BadRequestError, NotFoundError } from "@/middleware/errors.js";

describe("errors", () => {
  it("sets status codes and default not-found message", () => {
    const notFound = new NotFoundError();
    expect(notFound).toBeInstanceOf(AppError);
    expect(notFound.statusCode).toBe(404);
    expect(notFound.message).toBe("Not found");

    const badRequest = new BadRequestError("invalid");
    expect(badRequest.statusCode).toBe(400);
    expect(badRequest.message).toBe("invalid");
  });
});
