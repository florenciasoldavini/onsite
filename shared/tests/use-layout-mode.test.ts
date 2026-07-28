import { designTokens } from "@/shared/theme/tokens";
import { resolveLayoutMode } from "@/shared/utils/layout-mode";
import { describe, expect, it } from "vitest";

describe("adaptive layout mode", () => {
  const { breakpointDesktop, breakpointTablet } = designTokens.layout;

  it("uses compact below the tablet breakpoint", () => {
    expect(resolveLayoutMode(breakpointTablet - 1)).toBe("compact");
  });

  it("uses medium from the tablet breakpoint", () => {
    expect(resolveLayoutMode(breakpointTablet)).toBe("medium");
    expect(resolveLayoutMode(breakpointDesktop - 1)).toBe("medium");
  });

  it("uses expanded from the desktop breakpoint", () => {
    expect(resolveLayoutMode(breakpointDesktop)).toBe("expanded");
  });
});
