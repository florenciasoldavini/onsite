import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  getOffsetPageRange,
  toPaginatedResult
} from "@/shared/utils/pagination";

describe("offset pagination", () => {
  it("creates an inclusive range with one lookahead row", () => {
    expect(getOffsetPageRange({ offset: 24, pageSize: 24 })).toEqual({
      from: 24,
      offset: 24,
      pageSize: 24,
      to: 48
    });
  });

  it("normalizes invalid values and caps page size", () => {
    expect(getOffsetPageRange({ offset: -10, pageSize: Number.NaN })).toEqual({
      from: 0,
      offset: 0,
      pageSize: DEFAULT_PAGE_SIZE,
      to: DEFAULT_PAGE_SIZE
    });
    expect(getOffsetPageRange({ pageSize: MAX_PAGE_SIZE + 50 }).pageSize).toBe(
      MAX_PAGE_SIZE
    );
  });

  it("returns a next offset only when the lookahead row exists", () => {
    const range = getOffsetPageRange({ pageSize: 2 });

    expect(toPaginatedResult(["a", "b", "c"], range)).toEqual({
      items: ["a", "b"],
      nextOffset: 2
    });
    expect(toPaginatedResult(["a", "b"], range)).toEqual({
      items: ["a", "b"],
      nextOffset: null
    });
  });
});
