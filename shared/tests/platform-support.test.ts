import appConfig from "@/app.json";

describe("supported platforms and orientations", () => {
  it("declares web, iOS, and Android as supported platforms", () => {
    expect(appConfig.expo.platforms).toEqual(["ios", "android", "web"]);
  });

  it("allows native devices to follow portrait and landscape orientation", () => {
    expect(appConfig.expo.orientation).toBe("default");
  });

  it("supports iPad layouts and multitasking", () => {
    expect(appConfig.expo.ios.supportsTablet).toBe(true);
    expect(appConfig.expo.ios.requireFullScreen).toBe(false);
  });

  it("does not constrain installed web apps to one orientation", () => {
    expect(appConfig.expo.web.orientation).toBe("any");
  });
});
