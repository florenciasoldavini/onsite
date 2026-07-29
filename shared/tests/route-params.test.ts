import {
  firstRouteParam,
  getUrlFragmentParam,
  parseOptionalUuidRouteParam,
  parseRequiredUuidRouteParam
} from "@/shared/utils/route-params";

describe("route params", () => {
  it("uses the first value from repeated route parameters", () => {
    expect(firstRouteParam(["first", "second"])).toBe("first");
  });

  it("accepts and trims a required UUID route parameter", () => {
    expect(
      parseRequiredUuidRouteParam(" 10000000-0000-4000-8000-000000000001 ")
    ).toBe("10000000-0000-4000-8000-000000000001");
  });

  it.each([undefined, "", "project-1", ["invalid"]])(
    "rejects missing or malformed required UUID route parameters",
    (value) => {
      expect(parseRequiredUuidRouteParam(value)).toBeNull();
    }
  );

  it("returns undefined for a missing or malformed optional UUID", () => {
    expect(parseOptionalUuidRouteParam(undefined)).toBeUndefined();
    expect(parseOptionalUuidRouteParam("invalid")).toBeUndefined();
  });

  it("accepts an optional UUID route parameter", () => {
    expect(
      parseOptionalUuidRouteParam([
        "10000000-0000-4000-8000-000000000001",
        "ignored"
      ])
    ).toBe("10000000-0000-4000-8000-000000000001");
  });

  it("reads values from a URL fragment without exposing invalid URLs", () => {
    expect(
      getUrlFragmentParam(
        "https://onzait.example/invitations/accept#token=secret",
        "token"
      )
    ).toBe("secret");
    expect(getUrlFragmentParam("not a URL", "token")).toBeUndefined();
    expect(getUrlFragmentParam(null, "token")).toBeUndefined();
  });
});
