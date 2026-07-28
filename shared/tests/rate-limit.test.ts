import { consumeFixedWindowRateLimit } from "@/shared/utils/rate-limit";

describe("fixed-window rate limit", () => {
  it("allows requests until the fixed window limit is reached", () => {
    const store = new Map();

    expect(
      consumeFixedWindowRateLimit({
        key: "user",
        limit: 2,
        now: 1000,
        store,
        windowMs: 60_000
      }).allowed
    ).toBe(true);
    expect(
      consumeFixedWindowRateLimit({
        key: "user",
        limit: 2,
        now: 1001,
        store,
        windowMs: 60_000
      }).allowed
    ).toBe(true);
    expect(
      consumeFixedWindowRateLimit({
        key: "user",
        limit: 2,
        now: 1002,
        store,
        windowMs: 60_000
      }).allowed
    ).toBe(false);
  });
});
